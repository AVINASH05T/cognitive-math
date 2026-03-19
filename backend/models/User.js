const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['student', 'admin', 'editor'], 
        default: 'student' 
    },
    standard: { 
        type: String 
    },
    parentPhone: { 
        type: String 
    },
    dob: { 
        type: Date 
    },
    profileImage: { 
        type: String, 
        default: '' 
    },
    achievements: [{ 
        type: String 
    }],
    points: { 
        type: Number, 
        default: 0 
    },
    completedCourses: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course' 
    }],
    registeredCourses: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course' 
    }],
    resetToken: { 
        type: String 
    },
    resetTokenExpiry: { 
        type: Date 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('User', userSchema);