const User = require('../Models/Users');
const Profile = require('../Models/Profile');
const Solution = require('../Models/Solutions');

const VALID_ROLES = ['user', 'admin'];

// ---------------------------------------------------------------------------
// New in this change — wire into your admin routes file, all behind
// `protect` + `requireAdmin` same as the routes above:
//
//   GET /api/admin/analytics/submission-trends?days=30
//   GET /api/admin/analytics/user-growth?days=30
//   GET /api/admin/analytics/language-distribution
//   GET /api/admin/analytics/active-users
//   GET /api/admin/moderation/suspicious?hours=24&burstThreshold=8&windowMinutes=5
//   PUT /api/admin/users/:id/ban            body: { banned: true|false }
//
// toggleUserBan requires an `isBanned` field on the User model (added to
// Users.js) — you'll also want a check for it wherever submissions are
// created/compiled, since this endpoint only flips the flag.
// ---------------------------------------------------------------------------

// GET /api/admin/users
// Returns every user plus lightweight activity stats, assembled from three
// cheap queries instead of N+1 per-user lookups.
const getAllUsers = async (req, res) => {
    try {
        const [users, profiles, activityStats] = await Promise.all([
            User.find().select('username email role createdAt isBanned').sort({ createdAt: -1 }).lean(),
            Profile.find().select('user stats.problemsSolved').lean(),
            Solution.aggregate([
                { $group: { _id: '$user', submissionCount: { $sum: 1 }, lastActive: { $max: '$submittedAt' } } }
            ])
        ]);

        const solvedByUser = new Map(profiles.map(p => [String(p.user), p.stats?.problemsSolved || 0]));
        const activityByUser = new Map(activityStats.map(a => [String(a._id), a]));

        const data = users.map(u => {
            const activity = activityByUser.get(String(u._id));
            return {
                _id: u._id,
                username: u.username,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt,
                isBanned: u.isBanned || false,
                solvedCount: solvedByUser.get(String(u._id)) || 0,
                submissionCount: activity?.submissionCount || 0,
                lastActive: activity?.lastActive || null
            };
        });

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users: ' + error.message });
    }
};

// GET /api/admin/activity?limit=100
// Most recent submissions across every user, for the admin activity feed.
const getRecentActivity = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);

        const submissions = await Solution.find()
            .populate('user', 'username')
            .populate('problem', 'name code')
            .sort({ submittedAt: -1 })
            .limit(limit)
            .lean();

        // Guard against orphaned references (e.g. a problem or user that was
        // since deleted) rather than letting them blow up the response.
        const data = submissions
            .filter(s => s.user && s.problem)
            .map(s => ({
                _id: s._id,
                userId: s.user._id,
                username: s.user.username,
                problemCode: s.problem.code,
                problemName: s.problem.name,
                language: s.language,
                verdict: s.verdict,
                createdAt: s.submittedAt
            }));

        res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch activity: ' + error.message });
    }
};

// PUT /api/admin/users/:id/role
// Grants or revokes admin access. Trusts the client for UX but re-checks
// both safety rules server-side, since the client-side checks in
// AdminUsers.jsx are just for a good UX, not real enforcement.
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const requesterId = req.user?.id || req.user?._id;

        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ success: false, message: `Role must be one of: ${VALID_ROLES.join(', ')}` });
        }

        // Rule 1: an admin can't change their own access from this panel —
        // avoids accidentally locking yourself out with no one to undo it.
        if (String(id) === String(requesterId)) {
            return res.status(400).json({ success: false, message: "You can't change your own admin access." });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Rule 2: never revoke the last remaining admin — that would leave
        // nobody able to grant admin access back to anyone, ever.
        if (targetUser.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ success: false, message: 'Cannot revoke the last remaining admin.' });
            }
        }

        targetUser.role = role;
        await targetUser.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `${targetUser.username} is now ${role === 'admin' ? 'an admin' : 'a regular user'}.`,
            data: { _id: targetUser._id, username: targetUser.username, role: targetUser.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update role: ' + error.message });
    }
};

// GET /api/admin/analytics/submission-trends?days=30
// Daily submission volume, split into accepted vs. failed, for a platform-wide
// trend chart. Zero-activity days are filled in explicitly so the chart never
// shows a misleading gap vs. an honest flat zero.
const getSubmissionTrends = async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - (days - 1));

        const rows = await Solution.aggregate([
            { $match: { submittedAt: { $gte: since } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
                    total: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } }
                }
            }
        ]);
        const byDay = new Map(rows.map(r => [r._id, r]));

        const data = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setUTCDate(d.getUTCDate() + i);
            const key = d.toISOString().slice(0, 10);
            const row = byDay.get(key);
            const total = row?.total || 0;
            const accepted = row?.accepted || 0;
            data.push({ date: key, total, accepted, failed: total - accepted });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch submission trends: ' + error.message });
    }
};

// GET /api/admin/analytics/user-growth?days=30
// New signups per day plus a running cumulative total, for a growth chart.
const getUserGrowth = async (req, res) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 180);
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - (days - 1));

        const [rows, priorCount] = await Promise.all([
            User.aggregate([
                { $match: { createdAt: { $gte: since } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, newUsers: { $sum: 1 } } }
            ]),
            User.countDocuments({ createdAt: { $lt: since } })
        ]);
        const byDay = new Map(rows.map(r => [r._id, r.newUsers]));

        let cumulative = priorCount;
        const data = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setUTCDate(d.getUTCDate() + i);
            const key = d.toISOString().slice(0, 10);
            const newUsers = byDay.get(key) || 0;
            cumulative += newUsers;
            data.push({ date: key, newUsers, totalUsers: cumulative });
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user growth: ' + error.message });
    }
};

// GET /api/admin/analytics/language-distribution
const getLanguageDistribution = async (req, res) => {
    try {
        const rows = await Solution.aggregate([
            {
                $group: {
                    _id: '$language',
                    count: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ['$verdict', 'Accepted'] }, 1, 0] } }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: rows.map(r => ({ language: r._id, count: r.count, accepted: r.accepted }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch language distribution: ' + error.message });
    }
};

// GET /api/admin/analytics/active-users
// DAU / WAU / MAU based on distinct users with a submission in the window.
const getActiveUserCounts = async (req, res) => {
    try {
        const now = Date.now();
        const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [dau, wau, mau, totalUsers] = await Promise.all([
            Solution.distinct('user', { submittedAt: { $gte: dayAgo } }),
            Solution.distinct('user', { submittedAt: { $gte: weekAgo } }),
            Solution.distinct('user', { submittedAt: { $gte: monthAgo } }),
            User.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: { dau: dau.length, wau: wau.length, mau: mau.length, totalUsers }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch active user counts: ' + error.message });
    }
};

// GET /api/admin/moderation/suspicious?hours=24&burstThreshold=8&windowMinutes=5
// Flags users whose submissions cluster unusually tightly in a short rolling
// window — a signal of scripted spam or brute-force resubmission rather than
// a person actually reading verdicts between attempts. Read-only detection;
// pair with toggleUserBan below to act on it.
const getSuspiciousActivity = async (req, res) => {
    try {
        const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 24, 1), 168);
        const burstThreshold = Math.max(parseInt(req.query.burstThreshold, 10) || 8, 3);
        const windowMinutes = Math.max(parseInt(req.query.windowMinutes, 10) || 5, 1);
        const since = new Date(Date.now() - hours * 60 * 60 * 1000);

        const submissions = await Solution.find({ submittedAt: { $gte: since } })
            .select('user submittedAt')
            .sort({ user: 1, submittedAt: 1 })
            .lean();

        const byUser = new Map();
        for (const s of submissions) {
            const key = String(s.user);
            if (!byUser.has(key)) byUser.set(key, []);
            byUser.get(key).push(s.submittedAt.getTime());
        }

        const windowMs = windowMinutes * 60 * 1000;
        const flagged = [];
        for (const [userId, timestamps] of byUser.entries()) {
            if (timestamps.length < burstThreshold) continue;

            // Sliding window: largest number of submissions inside any
            // `windowMinutes` span for this user.
            let maxBurst = 1;
            let left = 0;
            for (let right = 0; right < timestamps.length; right++) {
                while (timestamps[right] - timestamps[left] > windowMs) left++;
                maxBurst = Math.max(maxBurst, right - left + 1);
            }

            if (maxBurst >= burstThreshold) {
                flagged.push({ userId, totalSubmissions: timestamps.length, maxBurst });
            }
        }
        flagged.sort((a, b) => b.maxBurst - a.maxBurst);

        const users = await User.find({ _id: { $in: flagged.map(f => f.userId) } })
            .select('username email role isBanned')
            .lean();
        const userMap = new Map(users.map(u => [String(u._id), u]));

        const data = flagged
            .filter(f => userMap.has(f.userId))
            .map(f => ({
                ...f,
                username: userMap.get(f.userId).username,
                email: userMap.get(f.userId).email,
                role: userMap.get(f.userId).role,
                isBanned: userMap.get(f.userId).isBanned || false
            }));

        res.status(200).json({ success: true, count: data.length, windowMinutes, burstThreshold, hours, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to compute suspicious activity: ' + error.message });
    }
};

// PUT /api/admin/users/:id/ban   body: { banned: boolean }
const toggleUserBan = async (req, res) => {
    try {
        const { id } = req.params;
        const { banned } = req.body;
        const requesterId = req.user?.id || req.user?._id;

        if (typeof banned !== 'boolean') {
            return res.status(400).json({ success: false, message: '`banned` must be a boolean.' });
        }
        if (String(id) === String(requesterId)) {
            return res.status(400).json({ success: false, message: "You can't ban your own account." });
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        if (targetUser.role === 'admin' && banned) {
            return res.status(400).json({ success: false, message: 'Demote this admin before banning them.' });
        }

        targetUser.isBanned = banned;
        await targetUser.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: `${targetUser.username} is now ${banned ? 'banned' : 'unbanned'}.`,
            data: { _id: targetUser._id, username: targetUser.username, isBanned: targetUser.isBanned }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update ban status: ' + error.message });
    }
};

module.exports = {
    getAllUsers,
    getRecentActivity,
    updateUserRole,
    getSubmissionTrends,
    getUserGrowth,
    getLanguageDistribution,
    getActiveUserCounts,
    getSuspiciousActivity,
    toggleUserBan
};