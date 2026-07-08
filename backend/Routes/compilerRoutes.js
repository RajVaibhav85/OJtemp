const express = require('express');
const router = express.Router();
const protect = require('../Middlewares/authMiddleware');
const compilerController = require('../Controllers/compilerController')


// router.post('/run', protect, compilerController.runCode);
router.post('/run', protect, compilerController.runCode);

module.exports = router;