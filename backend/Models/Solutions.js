const mongoose = require('mongoose');

const solutionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, "Problem reference is required"]
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "User reference is required"]
  },
  code: {
    type: String,
    required: [true, "Solution code is required"],
    trim: true
  },
  language: {
    type: String,
    enum: {
      values: ['JavaScript', 'Python', 'Java', 'C++', 'C', 'Ruby', 'Go', 'Rust'],
      message: "Language must be one of: JavaScript, Python, Java, C++, C, Ruby, Go, Rust"
    },
    required: [true, "Programming language is required"]
  },
  verdict: {
    type: String,
    enum: {
      values: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'],
      message: "Verdict must be one of the allowed statuses"
    },
    default: 'Pending'
  },
  executionTime: {
    type: Number,
    default: null
  },
  memory: {
    type: Number,
    default: null
  },
  output: {
    type: String,
    trim: true
  },
  error: {
    type: String,
    trim: true
  },
  testsPassed: {
    type: Number,
    default: 0
  },
  testsTotal: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', default: null },
}, { timestamps: true });
solutionSchema.index({ user: 1, problem: 1, language: 1 });
solutionSchema.index({ user: 1, problem: 1 });
solutionSchema.index({ submittedAt: -1 });

const Solution = mongoose.model('Solution', solutionSchema);

module.exports = Solution;