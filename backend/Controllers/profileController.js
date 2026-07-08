const Profile = require('../Models/Profile');
const Solution = require('../Models/Solutions');
const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// New in this change — wire into your profile routes file:
//
//   GET /api/profile/insights
//     -> streak heatmap, language-wise stats, recent activity, and
//        cumulative solved-over-time series for the logged-in user
//        (getProfileInsights). Put behind `protect` same as the routes above.
// ---------------------------------------------------------------------------

const updateProfile = async (req, res, next) => {
    try {
        const { bio, github, linkedin, website, languages, frameworks } = req.body;
        // Fallback selector ensures we parse the token identification parameters regardless of middleware format
        const userId = req.user?.id || req.user?._id; 

        if (!userId) {
            return res.status(401).json({ success: false, message: "User context unverified." });
        }

        const updatedProfile = await Profile.findOneAndUpdate(
            { user: userId },
            {
                $set: {
                    bio: bio || "",
                    'socials.github': github || "",
                    'socials.linkedin': linkedin || "",
                    'socials.website': website || "",
                    'skills.languages': Array.isArray(languages) ? languages : (languages ? languages.split(',').map(s => s.trim()) : []),
                    'skills.frameworks': Array.isArray(frameworks) ? frameworks : (frameworks ? frameworks.split(',').map(s => s.trim()) : [])
                }
            },
            { 
                returnDocument: 'after',
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true 
            }
        ).populate('user', 'username email dob role');

        res.status(200).json({ success: true, data: updatedProfile });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User context payload unreachable." });
        }

        const userProfile = await Profile.findOneAndUpdate(
            { user: userId },
            { $setOnInsert: { user: userId } },
            { 
                returnDocument: 'after', 
                upsert: true, 
                setDefaultsOnInsert: true 
            }
        ).populate('user', 'username email dob role');
        
        res.status(200).json(userProfile);
    } catch (error) {
        next(error);
    }
};

// --- PROFILE INSIGHTS: streak heatmap, language stats, recent activity, progress ---
// Everything here is computed on-the-fly from Solution documents rather than
// stored on the Profile doc. Denormalized streak counters would need to be
// kept in sync from updateSolutionVerdict too, and this project has already
// been bitten once by server/repo state drifting apart — better to compute
// from the source of truth every time than add another place that can go stale.
const getProfileInsights = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User context unverified." });
        }
        const userObjectId = new mongoose.Types.ObjectId(userId);

        const oneYearAgo = new Date();
        oneYearAgo.setUTCDate(oneYearAgo.getUTCDate() - 364);
        oneYearAgo.setUTCHours(0, 0, 0, 0);

        const [heatmapAgg, languageAgg, recentActivity, firstSolvesAgg] = await Promise.all([
            // Daily activity for the heatmap: total submissions + how many were Accepted.
            Solution.aggregate([
                { $match: { user: userObjectId, submittedAt: { $gte: oneYearAgo } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                        count: { $sum: 1 },
                        solvedCount: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Language-wise breakdown: submissions, accepted, distinct problems solved.
            Solution.aggregate([
                { $match: { user: userObjectId } },
                {
                    $group: {
                        _id: '$language',
                        totalSubmissions: { $sum: 1 },
                        accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } },
                        solvedProblems: { $addToSet: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, '$problem', '$$REMOVE'] } }
                    }
                },
                { $sort: { totalSubmissions: -1 } }
            ]),

            // Recent activity feed.
            Solution.find({ user: userId })
                .populate('problem', 'name code difficulty')
                .sort({ submittedAt: -1 })
                .limit(10)
                .lean(),

            // First Accepted submission per problem -> daily "newly solved" counts,
            // which we turn into a cumulative series below.
            Solution.aggregate([
                { $match: { user: userObjectId, verdict: 'Accepted' } },
                { $sort: { submittedAt: 1 } },
                { $group: { _id: '$problem', firstSolvedAt: { $first: '$submittedAt' } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$firstSolvedAt' } },
                        newlySolved: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // --- Streak calculation over distinct calendar days (UTC) with >=1 Accepted submission ---
        const solvedDaySet = new Set(heatmapAgg.filter(d => d.solvedCount > 0).map(d => d._id));
        const sortedSolvedDays = Array.from(solvedDaySet).sort();

        let longestStreak = 0;
        let runningStreak = 0;
        let prevDay = null;
        for (const dayStr of sortedSolvedDays) {
            const day = new Date(dayStr + 'T00:00:00Z');
            runningStreak = (prevDay && Math.round((day - prevDay) / 86400000) === 1) ? runningStreak + 1 : 1;
            longestStreak = Math.max(longestStreak, runningStreak);
            prevDay = day;
        }

        // Current streak: walk backward from today, but allow "yesterday" as the
        // anchor too so an ongoing streak isn't shown as broken before today ends.
        let currentStreak = 0;
        const cursor = new Date();
        cursor.setUTCHours(0, 0, 0, 0);
        if (!solvedDaySet.has(cursor.toISOString().slice(0, 10))) {
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }
        while (solvedDaySet.has(cursor.toISOString().slice(0, 10))) {
            currentStreak += 1;
            cursor.setUTCDate(cursor.getUTCDate() - 1);
        }

        // --- Cumulative progress-over-time series ---
        let cumulative = 0;
        const progressOverTime = firstSolvesAgg.map(d => {
            cumulative += d.newlySolved;
            return { date: d._id, solved: cumulative };
        });

        const languageStats = languageAgg.map(l => ({
            language: l._id,
            totalSubmissions: l.totalSubmissions,
            accepted: l.accepted,
            problemsSolved: l.solvedProblems.length,
            accuracyPercent: l.totalSubmissions > 0 ? Number(((l.accepted / l.totalSubmissions) * 100).toFixed(1)) : 0
        }));

        const recentActivityFormatted = recentActivity
            .filter(s => s.problem)
            .map(s => ({
                _id: s._id,
                problem: { name: s.problem.name, code: s.problem.code, difficulty: s.problem.difficulty },
                language: s.language,
                verdict: s.verdict,
                testsPassed: s.testsPassed,
                testsTotal: s.testsTotal,
                submittedAt: s.submittedAt
            }));

        res.status(200).json({
            success: true,
            data: {
                heatmap: heatmapAgg.map(d => ({ date: d._id, count: d.count, solved: d.solvedCount })),
                streaks: { currentStreak, longestStreak },
                languageStats,
                recentActivity: recentActivityFormatted,
                progressOverTime
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { updateProfile, getProfile, getProfileInsights };