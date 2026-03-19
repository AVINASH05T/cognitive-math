const mongoose = require('mongoose');

const siteContentSchema = new mongoose.Schema({
    logo: { 
        type: String, 
        default: '' 
    },
    hero: {
        tagline: { 
            type: String, 
            default: 'Strengthening Math Through Cognitive Learning' 
        },
        backgroundImage: { 
            type: String, 
            default: '' 
        }
    },
    stats: [{
        label: String,
        value: String,
        image: String
    }],
    teachers: [{
        name: String,
        qualification: String,
        image: String
    }],
    aboutSections: [{
        title: String,
        description: String,
        icon: { type: String, default: 'fa-star' }
    }],
    videos: [{
        title: String,
        url: String
    }],
    contact: {
        phone: { 
            type: String, 
            default: '+91 98765 43210' 
        },
        email: { 
            type: String, 
            default: 'info@cognitivemath.com' 
        }
    },
    socialLinks: {
        facebook: {
            url: String,
            visible: { type: Boolean, default: true }
        },
        twitter: {
            url: String,
            visible: { type: Boolean, default: true }
        },
        instagram: {
            url: String,
            visible: { type: Boolean, default: true }
        },
        youtube: {
            url: String,
            visible: { type: Boolean, default: true }
        },
        linkedin: {
            url: String,
            visible: { type: Boolean, default: false }
        }
    }
}, { 
    timestamps: true,
    versionKey: false 
});

module.exports = mongoose.model('SiteContent', siteContentSchema);