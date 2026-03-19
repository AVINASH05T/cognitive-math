const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/profiles');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + req.user._id + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// Upload profile image
router.post('/profile-image', protect, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Get current user to delete old image
        const user = await User.findById(req.user._id);
        
        // Delete old profile image if exists (and not the default)
        if (user.profileImage && !user.profileImage.includes('icons8.com')) {
            const oldImagePath = path.join(__dirname, '../../', user.profileImage);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }

        // Update user with new image path
        const imageUrl = `/uploads/profiles/${req.file.filename}`;
        user.profileImage = imageUrl;
        await user.save();

        res.json({ 
            success: true, 
            message: 'Profile image uploaded successfully',
            profileImage: imageUrl 
        });
    } catch (err) {
        console.error('Error uploading profile image:', err);
        res.status(500).json({ message: err.message });
    }
});

// Delete profile image
router.delete('/profile-image', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user.profileImage && !user.profileImage.includes('icons8.com')) {
            const imagePath = path.join(__dirname, '../../', user.profileImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        user.profileImage = '';
        await user.save();

        res.json({ 
            success: true, 
            message: 'Profile image removed' 
        });
    } catch (err) {
        console.error('Error deleting profile image:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;