const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    grade: { 
        type: String, 
        required: true 
    },
    subject: { 
        type: String, 
        default: 'Maths' 
    },
    board: { 
        type: String, 
        enum: ['CBSE', 'ICSE', 'Matric', 'All'], 
        default: 'All' 
    },
    description: { 
        type: String 
    },
    price: { 
        type: Number, 
        default: 0 
    },
    duration: { 
        type: String 
    },
    timing: { 
        type: String 
    },
    assignedStaff: { 
        type: String 
    },
    image: { 
        type: String, 
        default: '' 
    },
    icon: { 
        type: String, 
        default: '📘' 
    },
    zoomLink: { 
        type: String 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { 
    timestamps: true 
});

module.exports = mongoose.model('Course', courseSchema);