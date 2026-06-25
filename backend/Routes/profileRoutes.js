const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const profileController = require('../Controllers/profileController')


router.put('/update-profile', protect, profileController.updateProfile);

router.get('/get-profile', protect, profileController.getProfile);

module.exports = router;