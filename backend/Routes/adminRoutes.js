const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const requireAdmin = require('../Middlewares/adminMiddleware');
const { getAllUsers, getRecentActivity, updateUserRole } = require('../Controllers/adminController');


router.get('/users', protect, requireAdmin, getAllUsers);
router.get('/activity', protect, requireAdmin, getRecentActivity);
router.put('/users/:id/role', protect, requireAdmin, updateUserRole);

module.exports = router;