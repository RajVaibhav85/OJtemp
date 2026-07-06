const Problem = require('../Models/Problems');
const TestCase = require('../Models/TestCases');
const Solution = require('../Models/Solutions');
const Profile = require('../Models/Profile');
const { recordContestSolve } = require('./contestController');

// ---------------------------------------------------------------------------
// New in this change — wire these into your db routes file if not already:
//
//   GET /api/db/problem-stats/:code
//     -> single-problem solve rate + pass/fail ratio (getProblemStats)
//
//   GET /api/db/problem-stats
//     -> solve rate + pass/fail ratio for every problem, hardest-first
//        (getAllProblemStats)
//
// Both are read-only aggregate stats; put them behind `protect` (and
// `requireAdmin` if this should be an admin-only dashboard rather than
// public per-problem difficulty stats).
// ---------------------------------------------------------------------------

const insertProblem = async (req, res) => {
    try {
        const {
            name,
            statement,
            code,
            difficulty,
            description,
            sampleInput,
            sampleOutput,
            constraints,
            tags,
            createdBy
        } = req.body;

        if (!name || !statement || !code || !difficulty) {
            return res.status(400).json({ 
                message: "Missing required fields. Name, statement, code/slug, and difficulty are required." 
            });
        }

        const problem = new Problem({
            name,
            statement,
            code,
            difficulty,
            description,
            sampleInput,
            sampleOutput,
            constraints,
            tags,
            createdBy
        });

        await problem.save();
        return res.status(201).json({ message: "Problem inserted successfully", problem });
        
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "A problem with this URL code slug already exists." });
        }
        
        console.error("Error inserting problem:", err);
        return res.status(500).json({ error: "Server Error: Failed to insert problem" });
    }
}

const getProblems = async (req, res) => {
    try {
        const { difficulty, tags, search } = req.query;
        const query = {};
        if (difficulty) {
            query.difficulty = difficulty;
        }
        if (tags) {
            let tagsArray = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
            tagsArray = tagsArray.filter(t => t.length > 0);
            if (tagsArray.length > 0) {
                query.tags = { $all: tagsArray }; 
            }
        }
        if (search) {
            query.name = { $regex: search, $options: 'i' }; 
        }
        // ENHANCEMENT: Added 'description' to fields selection
        const problems = await Problem.find(query)
            .select('name code difficulty description tags createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: problems.length,
            data: problems
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Server Error matching filters: ${error.message}`,
        });
    }
};

const getProblem = async (req, res) => {
    try{
        const problem = await Problem.findOne({code: req.params.code});
        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }
        res.status(200).json(problem);
    } catch (error) {
        res.status(500).json({ message: `Failed to fetch problem ${error.message}` });
    }
}

const updateProblem = async (req, res) => {
  try {
    const { code } = req.params;
    const updateData = req.body;

    if (updateData.code) {
      delete updateData.code;
    }

    const updatedProblem = await Problem.findOneAndUpdate(
      { code: code.toLowerCase() },
      updateData,
      { 
        new: true,
        runValidators: true,
        context: 'query' 
      }
    );

    if (!updatedProblem) {
      return res.status(404).json({
        success: false,
        message: `Problem log matching code index '${code}' could not be located.`
      });
    }

    res.status(200).json({
      success: true,
      message: "Problem parameters updated successfully.",
      data: updatedProblem
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages });
    }

    res.status(500).json({
      success: false,
      message: "An internal pipeline error occurred while updating problem metrics." + error.message
    });
  }
};

const deleteProblem = async (req, res) => {
  try {
    const { code } = req.params;

    const deletedProblem = await Problem.findOneAndDelete({ code: code.toLowerCase() });

    if (!deletedProblem) {
      return res.status(404).json({
        success: false,
        message: `Problem index registry mapping '${code}' does not exist.`
      });
    }

    res.status(200).json({
      success: true,
      message: `Problem registry cluster '${code}' successfully purged from the system core.`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed execution parameters during database record teardown lifecycle." + error.message
    });
  }
};

const insertTestCases = async (req, res) => {
  try{
      const { code } = req.params;
      const problem = await Problem.findOne({ code: code.toLowerCase() });
      
      if (!problem) {
          return res.status(404).json({ message: "Problem not found" });
      }
      const { testCases } = req.body;
      if (!Array.isArray(testCases) || testCases.length === 0) {
          return res.status(400).json({ message: "Test cases must be a non-empty array." });
      }
      const testCaseDocs = testCases.map(tc => ({
          problem: problem._id,
          input: tc.input,
          output: tc.output,
          isHidden: tc.isHidden || false,
          timeLimit: tc.timeLimit || problem.timeLimit,
          memoryLimit: tc.memoryLimit || problem.memoryLimit
      }));
      await TestCase.insertMany(testCaseDocs);
      res.status(201).json({ message: "Test cases inserted successfully.",
        testCases: testCaseDocs.map((tc, index) => ({
          input: tc.input,
          output: tc.output,
          isHidden: tc.isHidden,
          timeLimit: tc.timeLimit,
          memoryLimit: tc.memoryLimit
        }))
      });
  }
  catch(err){
    res.status(400).json({
      success: false,
      message: "Failed execution parameters during database record teardown lifecycle." + err.message
    })
  }
}

const getTestCases = async (req, res) => {
  try {
    const { code } = req.params;
    const problem = await Problem.findOne({ code: code.toLowerCase() });
    
    if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
    }
    
    const testCases = await TestCase.find({ problem: problem._id }).select('-problem -__v');
    
    res.status(200).json({
      success: true,
      count: testCases.length,
      data: testCases
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve test cases." + err.message
    });
  }
}

const updateTestCase = async (req, res) => {
  try {
    const { id } = req.params; // Expects testcase ID in the route parameters
    const updateData = req.body;

    // Prevent shifting the testcase to another problem via update
    if (updateData.problem) {
      delete updateData.problem;
    }

    const updatedTestCase = await TestCase.findByIdAndUpdate(
      id,
      updateData,
      { 
        new: true,
        runValidators: true 
      }
    );

    if (!updatedTestCase) {
      return res.status(404).json({
        success: false,
        message: "Test case could not be located."
      });
    }

    res.status(200).json({
      success: true,
      message: "Test case parameters updated successfully.",
      data: updatedTestCase
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An internal error occurred while updating the test case: " + error.message
    });
  }
};

const deleteTestCase = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTestCase = await TestCase.findByIdAndDelete(id);

    if (!deletedTestCase) {
      return res.status(404).json({
        success: false,
        message: "Test case does not exist."
      });
    }

    res.status(200).json({
      success: true,
      message: "Test case successfully purged from the system core."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed execution parameters during test case teardown: " + error.message
    });
  }
};


const submitSolution = async (req, res) => {
    try {
        const { problemId, userId, code, language, contestId } = req.body;

        if (!problemId || !userId || !code || !language) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing required tracking attributes: problemId, userId, code, and language are all required." 
            });
        }

        // Every submission is now stored as its own document (1user1problem1lang1code
        // policy removed), so we always create a fresh record instead of upserting
        // over the previous attempt. contestId is optional — only present when
        // this submission was made from inside a contest attempt, and is what
        // lets updateSolutionVerdict() below route an Accepted verdict into
        // that contest's leaderboard instead of (or in addition to) the
        // normal profile stats.
        const solution = await Solution.create({
            user: userId,
            problem: problemId,
            language: language,
            code: code,
            contest: contestId || null,
            verdict: 'Pending', // Reset verdict status during the compilation sequence pipeline
            submittedAt: new Date()
        });

        return res.status(200).json({ 
            success: true, 
            message: "Solution synchronized successfully", 
            data: solution 
        });

    } catch (err) {
        console.error("Error synchronizing tracking solution parameters:", err);
        return res.status(500).json({ 
            success: false, 
            error: "Server Error: Failed to process runtime workspace update matrix" 
        });
    }
};

const updateSolutionVerdict = async (req, res) => {
    try {
        const { id } = req.params;
        const { verdict, executionTime, memory, output, testsPassed, testsTotal } = req.body;

        // 1. Update the solution document
        const updatedSolution = await Solution.findByIdAndUpdate(
            id,
            { $set: { verdict, executionTime, memory, output, testsPassed, testsTotal } },
            { new: true }
        );

        if (!updatedSolution) {
            return res.status(404).json({ success: false, message: "Solution record not found." });
        }

        // 2. If solution is accepted, update user profile statistics
        if (verdict === 'Accepted') {
            // If this submission was made inside a contest attempt, record
            // the solve there too — separately from (and in addition to)
            // the normal profile stats below, so contest results never
            // leak into someone's regular solved-problems history and
            // vice versa.
            if (updatedSolution.contest) {
                const contestResult = await recordContestSolve({
                    contestId: updatedSolution.contest,
                    userId: updatedSolution.user,
                    problemId: updatedSolution.problem,
                    solutionId: updatedSolution._id,
                    executionTime,
                    memory,
                });
                if (!contestResult.ok) {
                    console.warn('Contest solve not recorded:', contestResult.message);
                }
            }

            const problemData = await Problem.findById(updatedSolution.problem);
            if (problemData) {
                const problemSlug = problemData.code; // problem slug (e.g., 'two-sum')
                const difficultyField = `stats.difficultyBreakdown.${(problemData.difficulty || 'Medium').toLowerCase()}`;

                // Locate profile or insert baseline row atomically
                const userProfile = await Profile.findOne({ user: updatedSolution.user });
                
                if (userProfile) {
                    // Check if problem slug has already been solved to prevent double-counting metrics
                    const alreadySolved = userProfile.stats?.solvedProblemsList?.includes(problemSlug);

                    if (!alreadySolved) {
                        await Profile.findOneAndUpdate(
                            { user: updatedSolution.user },
                            {
                                $addToSet: { 'stats.solvedProblemsList': problemSlug },
                                $inc: { 
                                    'stats.problemsSolved': 1,
                                    [difficultyField]: 1 
                                }
                            }
                        );
                    }
                } else {
                    // Initialize clean baseline if document record doesn't exist yet
                    await Profile.create({
                        user: updatedSolution.user,
                        stats: {
                            problemsSolved: 1,
                            difficultyBreakdown: {
                                easy: problemData.difficulty === 'Easy' ? 1 : 0,
                                medium: problemData.difficulty === 'Medium' ? 1 : 0,
                                hard: problemData.difficulty === 'Hard' ? 1 : 0
                            },
                            solvedProblemsList: [problemSlug]
                        }
                    });
                }
            }
        }

        return res.status(200).json({ success: true, data: updatedSolution });
    } catch (err) {
        console.error("Verdict tracking exception sync failure:", err);
        return res.status(500).json({ success: false, error: "Internal Server Verification Error" });
    }
};

// --- NEW READ CONTROLLER FOR FETCHING CODE ON LOAD ---
const getLatestSubmission = async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    // Fetch the most recent submission document matching user and problem
    const latest = await Solution.findOne({ user: userId, problem: problemId })
                                 .sort({ createdAt: -1 });

    if (!latest) {
      return res.status(200).json({ success: false, message: "No previous attempts found." });
    }

    return res.status(200).json({ success: true, data: latest });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error fetching previous entry: " + error.message });
  }
};

// --- ALL SUBMISSIONS BY A USER (used by the Profile page's submission history) ---
const getUserSubmissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const submissions = await Solution.find({ user: userId })
      .populate('problem', 'name code difficulty')
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user submissions: " + error.message
    });
  }
};

// --- ALL SUBMISSIONS FOR A SPECIFIC USER + PROBLEM (used by the Coder page's history tab) ---
const getProblemSubmissions = async (req, res) => {
  try {
    const { userId, problemId } = req.params;

    const submissions = await Solution.find({ user: userId, problem: problemId })
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching problem submissions: " + error.message
    });
  }
};

// --- PER-PROBLEM SOLVE RATE / PASS-FAIL RATIO (single problem) ---
// Two solve-rate flavors are returned because they answer different questions:
//   - submissionSolveRatePercent: of every submission ever made on this problem,
//     what fraction were Accepted. Skews low on problems people brute-force via
//     repeated resubmission.
//   - userSolveRatePercent: of the distinct users who attempted this problem,
//     what fraction eventually got an Accepted. A truer "difficulty" signal.
const getProblemStats = async (req, res) => {
  try {
    const { code } = req.params;
    const problem = await Problem.findOne({ code: code.toLowerCase() });

    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    const verdictCounts = await Solution.aggregate([
      { $match: { problem: problem._id } },
      { $group: { _id: '$verdict', count: { $sum: 1 } } }
    ]);

    const verdictBreakdown = {};
    let totalSubmissions = 0;
    verdictCounts.forEach(v => {
      verdictBreakdown[v._id] = v.count;
      totalSubmissions += v.count;
    });
    const acceptedCount = verdictBreakdown['Accepted'] || 0;
    const failedCount = totalSubmissions - acceptedCount;

    const [usersAttempted, usersSolved] = await Promise.all([
      Solution.distinct('user', { problem: problem._id }),
      Solution.distinct('user', { problem: problem._id, verdict: 'Accepted' })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        problem: { code: problem.code, name: problem.name, difficulty: problem.difficulty },
        totalSubmissions,
        acceptedCount,
        failedCount,
        // Ratio of accepted:failed submissions. When there are zero failures,
        // there's no meaningful ratio to divide by, so we just surface the
        // accepted count itself (still 0 if nothing has been submitted at all).
        passFailRatio: failedCount > 0 ? Number((acceptedCount / failedCount).toFixed(2)) : acceptedCount,
        submissionSolveRatePercent: totalSubmissions > 0 ? Number(((acceptedCount / totalSubmissions) * 100).toFixed(2)) : 0,
        usersAttempted: usersAttempted.length,
        usersSolved: usersSolved.length,
        userSolveRatePercent: usersAttempted.length > 0 ? Number(((usersSolved.length / usersAttempted.length) * 100).toFixed(2)) : 0,
        verdictBreakdown
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error computing problem stats: " + error.message });
  }
};

// --- PER-PROBLEM SOLVE RATE / PASS-FAIL RATIO (every problem, for a dashboard table) ---
const getAllProblemStats = async (req, res) => {
  try {
    const bucketed = await Solution.aggregate([
      { $group: { _id: { problem: '$problem', verdict: '$verdict' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.problem', totalSubmissions: { $sum: '$count' }, verdicts: { $push: { verdict: '$_id.verdict', count: '$count' } } } }
    ]);

    if (bucketed.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const [solvedAgg, attemptedAgg, problems] = await Promise.all([
      Solution.aggregate([
        { $match: { verdict: 'Accepted' } },
        { $group: { _id: '$problem', usersSolved: { $addToSet: '$user' } } }
      ]),
      Solution.aggregate([
        { $group: { _id: '$problem', usersAttempted: { $addToSet: '$user' } } }
      ]),
      Problem.find({ _id: { $in: bucketed.map(b => b._id) } }).select('name code difficulty')
    ]);

    const solvedMap = new Map(solvedAgg.map(s => [String(s._id), s.usersSolved.length]));
    const attemptedMap = new Map(attemptedAgg.map(a => [String(a._id), a.usersAttempted.length]));
    const problemMap = new Map(problems.map(p => [String(p._id), p]));

    const data = bucketed
      .map(b => {
        const p = problemMap.get(String(b._id));
        if (!p) return null; // orphaned submissions whose problem was since deleted

        const verdictBreakdown = {};
        b.verdicts.forEach(v => { verdictBreakdown[v.verdict] = v.count; });
        const acceptedCount = verdictBreakdown['Accepted'] || 0;
        const failedCount = b.totalSubmissions - acceptedCount;
        const usersAttempted = attemptedMap.get(String(b._id)) || 0;
        const usersSolved = solvedMap.get(String(b._id)) || 0;

        return {
          problem: { code: p.code, name: p.name, difficulty: p.difficulty },
          totalSubmissions: b.totalSubmissions,
          acceptedCount,
          failedCount,
          passFailRatio: failedCount > 0 ? Number((acceptedCount / failedCount).toFixed(2)) : acceptedCount,
          submissionSolveRatePercent: b.totalSubmissions > 0 ? Number(((acceptedCount / b.totalSubmissions) * 100).toFixed(2)) : 0,
          usersAttempted,
          usersSolved,
          userSolveRatePercent: usersAttempted > 0 ? Number(((usersSolved / usersAttempted) * 100).toFixed(2)) : 0,
          verdictBreakdown
        };
      })
      .filter(Boolean)
      // Hardest (lowest user solve rate) first — the most useful default
      // ordering for an admin/analytics dashboard glancing for weak problems.
      .sort((a, b) => a.userSolveRatePercent - b.userSolveRatePercent);

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error computing problem stats: " + error.message });
  }
};

module.exports = {
    insertProblem,
    getProblems,
    getProblem,
    updateProblem,
    deleteProblem,
    insertTestCases,
    getTestCases,
    updateTestCase,
    deleteTestCase,
    submitSolution,
    updateSolutionVerdict,
    getLatestSubmission, // Kept for backwards compatibility
    getUserSubmissions,
    getProblemSubmissions,
    getProblemStats,        // NEW
    getAllProblemStats      // NEW
};

// ### INSERT PROBLEM

// {
//   "name": "Contains Duplicate",
//   "code": "contains-duplicate",
//   "difficulty": "Easy",
//   "statement": "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
//   "description": "A classic warm-up array problem that tests your basic understanding of hash sets, search lookup speeds, and frequency mapping.",
//   "sampleInput": "[1, 2, 3, 1]",
//   "sampleOutput": "true",
//   "constraints": "1 <= nums.length <= 10^5\n-10^9 <= nums[i] <= 10^9",
//   "tags": ["Array", "Hash Table"]
// }

// {
//   "name": "Longest Substring Without Repeating Characters",
//   "code": "longest-substring-without-repeating-characters",
//   "difficulty": "Medium",
//   "statement": "Given a string s, find the length of the longest substring without repeating characters.",
//   "description": "An essential sliding window problem where you maintain a variable-sized window tracking characters. Ideal for evaluating string manipulation and optimal tracking layouts.",
//   "sampleInput": "\"abcabcbb\"",
//   "sampleOutput": "3",
//   "constraints": "0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.",
//   "tags": ["String", "Sliding Window"]
// }

// {
//   "name": "Edit Distance",
//   "code": "edit-distance",
//   "difficulty": "Hard",
//   "statement": "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character",
//   "description": "A foundational Levenshtein Distance dynamic programming problem. It expects an optimal two-dimensional state array approach mapping matrix lookups over character permutations.",
//   "sampleInput": "word1 = \"horse\", word2 = \"ros\"",
//   "sampleOutput": "3",
//   "constraints": "0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.",
//   "tags": ["String", "Dynamic Programming"]
// }


// ### GET PROBLEMS

// {
//   "difficulty": "Medium",
//   "tags": "['Array','Math']",
//   "search": "sum"
// }


// ### insert-testcases/:code

// {
//   "testCases": [
//     {
//       "input": "4\n1 2 3 1",
//       "output": "true",
//       "isHidden": false,
//       "timeLimit": 1000,
//       "memoryLimit": 128
//     },
//     {
//       "input": "4\n1 2 3 4",
//       "output": "false",
//       "isHidden": false
//     },
//     {
//       "input": "10\n1 1 1 3 3 4 3 2 4 2",
//       "output": "true",
//       "isHidden": true
//     },
//     {
//       "input": "3\n-1000000000 1000000000 -1000000000",
//       "output": "true",
//       "isHidden": true
//     },
//     {
//       "input": "1\n42",
//       "output": "false",
//       "isHidden": true
//     }
//   ]
// }