const User = require('../Models/Users');
const Profile = require('../Models/Profile');
const Solution = require('../Models/Solutions');

const VALID_ROLES = ['user', 'admin'];

// GET /api/admin/users
// Returns every user plus lightweight activity stats, assembled from three
// cheap queries instead of N+1 per-user lookups.
const getAllUsers = async (req, res) => {
    try {
        const [users, profiles, activityStats] = await Promise.all([
            User.find().select('username email role createdAt').sort({ createdAt: -1 }).lean(),
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

module.exports = { getAllUsers, getRecentActivity, updateUserRole };