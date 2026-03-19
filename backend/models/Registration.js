const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'paid', 'failed'], 
        default: 'pending' 
    },
    paymentId: { 
        type: String 
    },
    amountPaid: { 
        type: Number 
    },
    attended: { 
        type: Boolean, 
        default: false 
    },
    completed: { 
        type: Boolean, 
        default: false 
    },
    registeredAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Registration', registrationSchema);