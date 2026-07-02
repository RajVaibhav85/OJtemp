const Contest = require('../Models/Contest');
const ContestAttempt = require('../Models/ContestAttempt');
const Problem = require('../Models/Problems');

// ─── Admin: create / update / delete ──────────────────────────────────────

const createContest = async (req, res) => {
    try {
        const {
            title, description, startTime, endTime,
            selectionMode, problemIds, randomCount, difficulty, tags,
        } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'title, startTime and endTime are required.' });
        }
        if (new Date(endTime) <= new Date(startTime)) {
            return res.status(400).json({ success: false, message: 'endTime must be after startTime.' });
        }

        let problems = [];

        if (selectionMode === 'random') {
            const match = {};
            if (difficulty) match.difficulty = difficulty;
            if (tags && tags.length) match.tags = { $all: tags };

            const count = Number(randomCount) || 5;
            const sampled = await Problem.aggregate([
                { $match: match },
                { $sample: { size: count } },
                { $project: { _id: 1 } },
            ]);

            if (sampled.length < count) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${sampled.length} problem(s) match the given filters; requested ${count}.`,
                });
            }
            problems = sampled.map(p => p._id);
        } else {
            if (!Array.isArray(problemIds) || problemIds.length === 0) {
                return res.status(400).json({ success: false, message: 'problemIds must be a non-empty array for handpicked contests.' });
            }
            problems = problemIds;
        }

        const contest = await Contest.create({
            title,
            description,
            problems,
            startTime,
            endTime,
            selectionMode: selectionMode || 'handpicked',
            createdBy: req.user?.id,
        });

        return res.status(201).json({ success: true, data: contest });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create contest: ' + err.message });
    }
};

const updateContest = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };
        delete updateData.createdBy;

        const contest = await Contest.findById(id);
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

        // Once the contest has gone live, changing the problem set or start
        // time would invalidate whatever leaderboard is already forming —
        // lock those two fields down past that point. Description/endTime
        // (extending, say) remain editable.
        if (Date.now() >= contest.startTime.getTime()) {
            delete updateData.problems;
            delete updateData.startTime;
        }

        Object.assign(contest, updateData);
        await contest.save();

        return res.status(200).json({ success: true, data: contest });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update contest: ' + err.message });
    }
};

const deleteContest = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByIdAndDelete(id);
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });
        await ContestAttempt.deleteMany({ contest: id });
        return res.status(200).json({ success: true, message: 'Contest deleted.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete contest: ' + err.message });
    }
};

// ─── Listing / detail ──────────────────────────────────────────────────────

const listContests = async (req, res) => {
    try {
        const contests = await Contest.find()
            .select('title description startTime endTime selectionMode problems')
            .sort({ startTime: -1 });

        const data = contests.map(c => ({
            _id: c._id,
            title: c.title,
            description: c.description,
            startTime: c.startTime,
            endTime: c.endTime,
            problemCount: c.problems.length,
            status: c.status,
        }));

        return res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to list contests: ' + err.message });
    }
};

// Problem statements are only returned once this user has an attempt on
// record (official or practice) — otherwise anyone could read the problems
// without ever starting their clock.
const getContest = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const contest = await Contest.findById(id).populate('problems', 'name code difficulty tags');
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

        const attempt = userId ? await ContestAttempt.findOne({ contest: id, user: userId }) : null;

        const base = {
            _id: contest._id,
            title: contest.title,
            description: contest.description,
            startTime: contest.startTime,
            endTime: contest.endTime,
            status: contest.status,
            problemCount: contest.problems.length,
            myAttempt: attempt ? {
                isOfficial: attempt.isOfficial,
                joinedAt: attempt.joinedAt,
                finishedAt: attempt.finishedAt,
                totalSolved: attempt.totalSolved,
            } : null,
        };

        if (!attempt) return res.status(200).json({ success: true, data: base });

        return res.status(200).json({ success: true, data: { ...base, problems: contest.problems } });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch contest: ' + err.message });
    }
};

// ─── Joining ────────────────────────────────────────────────────────────────

const joinContest = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: 'userId is required.' });

        const contest = await Contest.findById(id).populate('problems', 'name code difficulty tags');
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

        const now = Date.now();
        if (now < contest.startTime.getTime()) {
            return res.status(400).json({ success: false, message: 'This contest has not started yet.' });
        }

        let attempt = await ContestAttempt.findOne({ contest: id, user: userId });
        if (attempt) {
            return res.status(200).json({
                success: true,
                message: 'Resuming your existing attempt.',
                data: { attempt, problems: contest.problems, contestEndTime: contest.endTime },
            });
        }

        const isOfficial = now <= contest.endTime.getTime();

        attempt = await ContestAttempt.create({
            contest: id,
            user: userId,
            isOfficial,
            joinedAt: new Date(),
            problemStats: contest.problems.map(p => ({ problem: p._id })),
        });

        return res.status(201).json({
            success: true,
            message: isOfficial
                ? 'Joined the live contest — this attempt counts on the leaderboard.'
                : 'The contest has ended; this is a practice attempt and will not appear on the leaderboard.',
            data: { attempt, problems: contest.problems, contestEndTime: contest.endTime },
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: 'You already have an attempt for this contest.' });
        }
        return res.status(500).json({ success: false, message: 'Failed to join contest: ' + err.message });
    }
};

// Called internally by dbController.updateSolutionVerdict when an Accepted
// solution belongs to a contest — not meant to be hit directly from the
// frontend, but exported in case you want a manual recovery path.
const recordContestSolve = async ({ contestId, userId, problemId, solutionId, executionTime, memory }) => {
    const contest = await Contest.findById(contestId);
    if (!contest) return { ok: false, message: 'Contest not found.' };

    const attempt = await ContestAttempt.findOne({ contest: contestId, user: userId });
    if (!attempt) return { ok: false, message: 'No attempt found for this user/contest.' };

    // Practice attempts get the same duration the live contest had, just
    // measured from their own joinedAt instead of the (already-passed) window.
    const deadline = attempt.isOfficial
        ? contest.endTime.getTime()
        : attempt.joinedAt.getTime() + (contest.endTime.getTime() - contest.startTime.getTime());

    if (Date.now() > deadline) {
        return { ok: false, message: 'Time is up for this attempt — solve was not recorded.' };
    }

    const stat = attempt.problemStats.find(p => p.problem.toString() === problemId.toString());
    if (!stat) return { ok: false, message: 'This problem is not part of the contest.' };

    stat.attempts += 1;

    if (!stat.solved) {
        stat.solved = true;
        stat.solvedAt = new Date();
        stat.bestExecutionTime = executionTime ?? null;
        stat.bestMemory = memory ?? null;
        stat.solution = solutionId || null;
        attempt.totalSolved += 1;
    }

    attempt.timeTakenSeconds = Math.round((Date.now() - attempt.joinedAt.getTime()) / 1000);
    await attempt.save();

    return { ok: true, attempt };
};

// Explicit "end my attempt" — call this when the user hits Submit Contest,
// or when the frontend countdown reaches zero.
const finishAttempt = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        const attempt = await ContestAttempt.findOne({ contest: id, user: userId });
        if (!attempt) return res.status(404).json({ success: false, message: 'No attempt found.' });

        if (!attempt.finishedAt) {
            attempt.finishedAt = new Date();
            if (attempt.timeTakenSeconds == null) {
                attempt.timeTakenSeconds = Math.round((attempt.finishedAt - attempt.joinedAt) / 1000);
            }
            await attempt.save();
        }

        return res.status(200).json({ success: true, data: attempt });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to finish attempt: ' + err.message });
    }
};

// ─── Leaderboard (official attempts only) ─────────────────────────────────

const getLeaderboard = async (req, res) => {
    try {
        const { id } = req.params;

        const contest = await Contest.findById(id);
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

        const attempts = await ContestAttempt.find({ contest: id, isOfficial: true })
            .populate('user', 'username')
            .lean();

        const ranked = attempts
            .map(a => ({
                user: a.user ? { id: a.user._id, username: a.user.username } : null,
                totalSolved: a.totalSolved,
                // Anyone who never explicitly finished but let the clock run
                // out is scored against the full contest duration, same as
                // if they'd submitted right at the buzzer.
                timeTakenSeconds: a.timeTakenSeconds ?? Math.round((contest.endTime.getTime() - a.joinedAt.getTime()) / 1000),
                joinedAt: a.joinedAt,
                finishedAt: a.finishedAt,
                problemStats: a.problemStats,
            }))
            // Standard competitive-programming ranking: more solved wins;
            // ties broken by whoever got there faster.
            .sort((x, y) => y.totalSolved - x.totalSolved || x.timeTakenSeconds - y.timeTakenSeconds)
            .map((row, idx) => ({ rank: idx + 1, ...row }));

        return res.status(200).json({
            success: true,
            status: contest.status,
            count: ranked.length,
            data: ranked,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to build leaderboard: ' + err.message });
    }
};

// ─── Personal evaluation (official OR practice) ───────────────────────────

const getMyEvaluation = async (req, res) => {
    try {
        const { id, userId } = req.params;

        const contest = await Contest.findById(id).populate('problems', 'name code difficulty');
        if (!contest) return res.status(404).json({ success: false, message: 'Contest not found.' });

        const attempt = await ContestAttempt.findOne({ contest: id, user: userId })
            .populate('problemStats.problem', 'name code difficulty')
            .populate('problemStats.solution');

        if (!attempt) {
            return res.status(404).json({ success: false, message: 'You have not attempted this contest.' });
        }

        let rank = null;
        if (attempt.isOfficial) {
            const officialAttempts = await ContestAttempt.find({ contest: id, isOfficial: true }).lean();
            const timeOf = a => a.timeTakenSeconds ?? Math.round((contest.endTime.getTime() - a.joinedAt.getTime()) / 1000);
            const sorted = officialAttempts
                .map(a => ({ id: a.user.toString(), totalSolved: a.totalSolved, time: timeOf(a) }))
                .sort((x, y) => y.totalSolved - x.totalSolved || x.time - y.time);
            rank = sorted.findIndex(a => a.id === userId.toString()) + 1;
        }

        return res.status(200).json({
            success: true,
            data: {
                contestTitle: contest.title,
                isOfficial: attempt.isOfficial,
                rank, // null for practice attempts — they never rank
                totalProblems: contest.problems.length,
                totalSolved: attempt.totalSolved,
                timeTakenSeconds: attempt.timeTakenSeconds,
                joinedAt: attempt.joinedAt,
                finishedAt: attempt.finishedAt,
                problemStats: attempt.problemStats,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to build evaluation: ' + err.message });
    }
};

module.exports = {
    createContest,
    updateContest,
    deleteContest,
    listContests,
    getContest,
    joinContest,
    recordContestSolve,
    finishAttempt,
    getLeaderboard,
    getMyEvaluation,
};