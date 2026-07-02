const express = require('express');
const router = express.Router();

const contestController = require('../Controllers/contestController');

// TODO: point these at whatever middleware your other protected routes use
// (e.g. the same ones guarding /api/auth/me and the admin problem routes).
const protect = require('../Middlewares/authMiddleware');
const requireAdmin = require('../Middlewares/adminMiddleware');

// Public
router.get('/', contestController.listContests);
router.get('/:id', contestController.getContest);
router.get('/:id/leaderboard', contestController.getLeaderboard);
router.get('/:id/evaluation/:userId', contestController.getMyEvaluation);

// Logged-in user
router.post('/:id/join', protect, contestController.joinContest);
router.post('/:id/finish', protect, contestController.finishAttempt);

// Admin only
router.post('/', protect, requireAdmin, contestController.createContest);
router.put('/:id', protect, requireAdmin, contestController.updateContest);
router.delete('/:id', protect, requireAdmin, contestController.deleteContest);

module.exports = router;

// Mount this in your main app file:
//   const contestRoutes = require('./Routes/contestRoutes');
//   app.use('/api/contests', contestRoutes);