const express = require('express');
const router = express.Router();
const dbController = require('../Controllers/dbController');

// Problem Routes
router.put('/insert-problem', dbController.insertProblem);
router.get('/get-problems', dbController.getProblems);

// Problem Stats & Analytics (Added)
router.get('/problem-stats', dbController.getAllProblemStats);
router.get('/problem-stats/:code', dbController.getProblemStats);

router.get('/get-problem/:code', dbController.getProblem);
router.put('/update-problem/:code', dbController.updateProblem);
router.delete('/delete-problem/:code', dbController.deleteProblem);

// Test Case Routes
router.post('/insert-testcases/:code', dbController.insertTestCases);
router.get('/get-testcases/:code', dbController.getTestCases);
router.put('/update-testcase/:id', dbController.updateTestCase);
router.delete('/delete-testcase/:id', dbController.deleteTestCase);

// Submission Management Architecture
router.post('/submit-solution/:code', dbController.submitSolution);
router.put('/update-solution-verdict/:id', dbController.updateSolutionVerdict);
router.get('/latest-submission/:userId/:problemId', dbController.getLatestSubmission);
router.get('/user-submissions/:userId', dbController.getUserSubmissions);
router.get('/problem-submissions/:userId/:problemId', dbController.getProblemSubmissions);

module.exports = router;