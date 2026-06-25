const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const authController = require('../Controllers/authController')


router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.post('/refresh', authController.refresh);

router.put('/change-password', protect, authController.changePassword);

router.get('/me', protect, authController.me);


module.exports = router;