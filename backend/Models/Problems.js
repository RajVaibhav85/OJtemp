const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Problem name is required"],
    trim: true,
    minlength: [3, "Problem name must be at least 3 characters"],
    maxlength: [200, "Problem name cannot exceed 200 characters"]
  },
  statement: {
    type: String,
    required: [true, "Problem statement is required"],
    trim: true,
    minlength: [10, "Problem statement must be at least 10 characters"]
  },
  code: {
    type: String,
    required: [true, "Problem code/slug is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, "Problem code must contain only lowercase letters, numbers, and hyphens"]
  },
  difficulty: {
    type: String,
    required: [true, "Difficulty level is required"],
    enum: {
      values: ['Easy', 'Medium', 'Hard'],
      message: "Difficulty must be Easy, Medium, or Hard"
    },
    default: 'Medium'
  },
  description: {
    type: String,
    trim: true
  },
  sampleInput: {
    type: String,
    trim: true
  },
  sampleOutput: {
    type: String,
    trim: true
  },
  constraints: {
    type: String,
    trim: true
  },
  timeLimit: {
    type: Number,
    required: [true, "Time limit is required"],
    max: [10000, "Time limit cannot exceed 10000ms (10 seconds)"],
    default: 2000
  },
  memoryLimit: {
    type: Number,
    required: [true, "Memory limit is required"],
    max: [512, "Memory limit cannot exceed 512MB"],
    default: 128
  },
  tags: {
    type: [String],
    trim: true,
    enum: {
      values: ['Array', 'String', 'Dynamic Programming', 'Graph', 'Tree', 'Math', 'Greedy', 'Backtracking', 'Sorting', 'Searching', 'Hash Table', 'Two Pointers', 'Sliding Window', 'Recursion', 'Bit Manipulation', 'Design', 'Database'],
      message: "Tag must be one of the predefined categories"
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, { timestamps: true });

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;