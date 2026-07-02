const mongoose = require('mongoose');

const ContestSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true }],

    // A contest runs on ONE shared clock, not a per-user rolling timer.
    // Everyone who joins while it's live is racing against the same
    // endTime, which is what makes "who finished faster" comparable on
    // the leaderboard. Practice attempts (joined after endTime) reuse
    // (endTime - startTime) as their personal duration instead.
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    selectionMode: { type: String, enum: ['handpicked', 'random'], default: 'handpicked' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

ContestSchema.index({ startTime: 1 });
ContestSchema.index({ endTime: 1 });

// Computed, never stored — so it can't ever go stale relative to the clock.
ContestSchema.virtual('status').get(function () {
    const now = Date.now();
    if (now < this.startTime.getTime()) return 'upcoming';
    if (now > this.endTime.getTime()) return 'completed';
    return 'live';
});

ContestSchema.set('toJSON', { virtuals: true });
ContestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contest', ContestSchema);