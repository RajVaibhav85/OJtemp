const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: [true, "Problem reference is required"]
  },
  input: {
    type: String,
    required: [true, "Test case input is required"],
    trim: true
  },
  output: {
    type: String,
    required: [true, "Test case output is required"],
    trim: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  timeLimit: {
    type: Number,
    default: 1000 // milliseconds
  },
  memoryLimit: {
    type: Number,
    default: 256 // MB
  }
}, { timestamps: true });

// Index for faster queries
testCaseSchema.index({ problem: 1 });

const TestCase = mongoose.model('TestCase', testCaseSchema);

module.exports = TestCase;