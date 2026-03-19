const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    name: { 
        type: String, 
        required: true 
    },
    rating: { 
        type: Number, 
        min: 1, 
        max: 5, 
        required: true 
    },
    comment: { 
        type: String, 
        required: true 
    },
    approved: { 
        type: Boolean, 
        default: false 
    },
    visible: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Testimonial', testimonialSchema);