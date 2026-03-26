const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    skillsKnown: [{
        type: String
    }],
    skillsToLearn: [{
        type: String
    }],
    otp: {
        type: String,
        required: true
    },
    otpExpires: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900 // Auto-delete after 15 minutes (900 seconds)
    }
});

module.exports = mongoose.model('PendingUser', pendingUserSchema);
