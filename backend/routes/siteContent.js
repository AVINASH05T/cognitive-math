const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Get public site content
router.get('/', async (req, res) => {
    try {
        let content = await SiteContent.findOne();
        if (!content) {
            content = new SiteContent();
            await content.save();
        }
        res.json(content);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Update site content with file uploads
router.post('/upload', protect, adminOnly, upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'heroBackground', maxCount: 1 },
    { name: 'statImage0', maxCount: 1 },
    { name: 'statImage1', maxCount: 1 },
    { name: 'statImage2', maxCount: 1 },
    { name: 'statImage3', maxCount: 1 },
    { name: 'teacherImage0', maxCount: 1 },
    { name: 'teacherImage1', maxCount: 1 },
    { name: 'teacherImage2', maxCount: 1 },
    { name: 'teacherImage3', maxCount: 1 }
]), async (req, res) => {
    try {
        let content = await SiteContent.findOne();
        if (!content) {
            content = new SiteContent();
        }

        // Handle logo upload
        if (req.files && req.files.logo) {
            const logoFile = req.files.logo[0];
            content.logo = `/uploads/${logoFile.filename}`;
        }

        // Handle hero background upload
        if (req.files && req.files.heroBackground) {
            const heroFile = req.files.heroBackground[0];
            if (!content.hero) content.hero = {};
            content.hero.backgroundImage = `/uploads/${heroFile.filename}`;
        }

        // Update text fields
        if (req.body.heroTagline) {
            if (!content.hero) content.hero = {};
            content.hero.tagline = req.body.heroTagline;
        }

        // Update contact info
        if (!content.contact) content.contact = {};
        if (req.body.contactPhone) content.contact.phone = req.body.contactPhone;
        if (req.body.contactEmail) content.contact.email = req.body.contactEmail;

        // Update stats with images
        if (req.body.stats) {
            const statsData = JSON.parse(req.body.stats);
            content.stats = statsData.map((stat, index) => {
                const imageField = `statImage${index}`;
                if (req.files && req.files[imageField]) {
                    stat.image = `/uploads/${req.files[imageField][0].filename}`;
                }
                return stat;
            });
        }

        // Update teachers with images
        if (req.body.teachers) {
            const teachersData = JSON.parse(req.body.teachers);
            content.teachers = teachersData.map((teacher, index) => {
                const imageField = `teacherImage${index}`;
                if (req.files && req.files[imageField]) {
                    teacher.image = `/uploads/${req.files[imageField][0].filename}`;
                }
                return teacher;
            });
        }

        // Update videos
        if (req.body.videos) {
            content.videos = JSON.parse(req.body.videos);
        }

        await content.save();
        
        res.json({ 
            success: true, 
            message: 'Content saved successfully',
            content 
        });
    } catch (err) {
        console.error('Error saving content:', err);
        res.status(500).json({ message: err.message });
    }
});

// Admin: Update site content (including aboutSections)
router.put('/', protect, adminOnly, async (req, res) => {
    try {
        let content = await SiteContent.findOne();
        if (!content) {
            content = new SiteContent();
        }

        // Update all fields from request body
        if (req.body.logo !== undefined) content.logo = req.body.logo;
        if (req.body.hero) content.hero = req.body.hero;
        if (req.body.stats) content.stats = req.body.stats;
        if (req.body.teachers) content.teachers = req.body.teachers;
        if (req.body.aboutSections) content.aboutSections = req.body.aboutSections;
        if (req.body.videos) content.videos = req.body.videos;
        if (req.body.contact) content.contact = req.body.contact;
        if (req.body.socialLinks) content.socialLinks = req.body.socialLinks;

        await content.save();
        res.json({ 
            success: true, 
            message: 'Content updated successfully',
            content 
        });
    } catch (err) {
        console.error('Error updating content:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;