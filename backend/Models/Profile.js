const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    bio: {
        type: String,
        maxlength: [250, "Bio cannot exceed 250 characters"],
        default: ""
    },
    socials: {
        github: { type: String, default: "" },
        linkedin: { type: String, default: "" },
        website: { type: String, default: "" }
    },
    skills: {
        languages: [{
            type: String,
            trim: true 
        }],
        frameworks: [{
            type: String,
            trim: true 
        }]
    },
    stats: {
        problemsSolved: {
            type: Number,
            default: 0
        },
        difficultyBreakdown: {
            easy: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            hard: { type: Number, default: 0 }
        },
        solvedProblemsList: [{
            type: String
        }]
    }
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;