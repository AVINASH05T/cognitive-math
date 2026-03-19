const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
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
    amount: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        default: 'inr' 
    },
    paymentIntentId: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['pending', 'succeeded', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: { 
        type: String 
    },
    receiptUrl: { 
        type: String 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Payment', paymentSchema);