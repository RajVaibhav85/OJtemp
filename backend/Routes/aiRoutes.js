const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const aiController = require('../Controllers/aiController')


// router.post('/ai-review', protect, aiController.aiReview)

router.post('/ai-review', aiController.aiReview)

module.exports = router;