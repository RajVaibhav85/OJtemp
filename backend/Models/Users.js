const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        unique: true,
        minlength: [2, "Username must be at least 2 characters long"],
        maxlength: [50, "Username cannot exceed 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        match: [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "Please enter a valid email address"
        ]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    dob: { 
        type: Date,
        required: true, 
    },
    role:{
        type: String,
        required: [true, "Role is required"],
        enum: ['user', 'admin'],
        default: 'user'
    },
}, { timestamps: true })

userSchema.pre('save', async function() {
    const user = this;                      // before storing password in DB, it is hashed
                                            // by bcrypt and stored in DB
    if (!user.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema)

module.exports = User