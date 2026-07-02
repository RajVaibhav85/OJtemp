const mongoose = require('mongoose');

const ProblemStatSchema = new mongoose.Schema({
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    solved: { type: Boolean, default: false },
    solvedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
    bestExecutionTime: { type: Number, default: null },
    bestMemory: { type: Number, default: null },
    solution: { type: mongoose.Schema.Types.ObjectId, ref: 'Solution', default: null },
}, { _id: false });

const ContestAttemptSchema = new mongoose.Schema({
    contest: { type: mongoose.Schema.Types.ObjectId, ref: 'Contest', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Set once at join time and never recomputed: true only if the user
    // joined while now was between contest.startTime and contest.endTime.
    // This is the single flag that keeps the leaderboard honest — everyone
    // else (didn't participate, or joined after it ended) still gets a
    // full personal evaluation, they just don't rank.
    isOfficial: { type: Boolean, required: true },

    joinedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },

    problemStats: [ProblemStatSchema],
    totalSolved: { type: Number, default: 0 },

    // Seconds from joinedAt to the last accepted solve. This is the
    // leaderboard tiebreaker: solved-count first, then this ascending.
    timeTakenSeconds: { type: Number, default: null },
}, { timestamps: true });

// One attempt per user per contest — whichever mode it was created in
// (official or practice) is final for that user/contest pair.
ContestAttemptSchema.index({ contest: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ContestAttempt', ContestAttemptSchema);