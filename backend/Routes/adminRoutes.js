const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const requireAdmin = require('../Middlewares/adminMiddleware');
const { getAllUsers, getRecentActivity, updateUserRole, getSubmissionTrends, getUserGrowth, getLanguageDistribution, getActiveUserCounts, getSuspiciousActivity, toggleUserBan } = require('../Controllers/adminController');


router.get('/users', protect, requireAdmin, getAllUsers);
router.get('/activity', protect, requireAdmin, getRecentActivity);
router.put('/users/:id/role', protect, requireAdmin, updateUserRole);
router.get('/analytics/submission-trends', protect, requireAdmin, getSubmissionTrends);
router.get('/analytics/user-growth', protect, requireAdmin, getUserGrowth);
router.get('/analytics/language-distribution', protect, requireAdmin, getLanguageDistribution);
router.get('/analytics/active-users', protect, requireAdmin, getActiveUserCounts);
router.get('/moderation/suspicious', protect, requireAdmin, getSuspiciousActivity);
router.put('/users/:id/ban', protect, requireAdmin, toggleUserBan);

module.exports = router;