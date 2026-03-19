const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for course image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads/courses');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'course-' + uniqueSuffix + ext);
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
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Public: Get all active courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Admin: Create course with image upload
router.post('/', protect, adminOnly, upload.single('courseImage'), async (req, res) => {
    try {
        const courseData = JSON.parse(JSON.stringify(req.body));
        
        // Handle price conversion
        if (courseData.price) {
            courseData.price = parseFloat(courseData.price);
        }

        // Handle isActive boolean
        if (courseData.isActive === 'true' || courseData.isActive === true) {
            courseData.isActive = true;
        } else if (courseData.isActive === 'false' || courseData.isActive === false) {
            courseData.isActive = false;
        }

        // Add image path if file was uploaded
        if (req.file) {
            courseData.image = `/uploads/courses/${req.file.filename}`;
        }

        const course = new Course(courseData);
        await course.save();
        res.status(201).json(course);
    } catch (err) {
        console.error('Error creating course:', err);
        res.status(500).json({ message: err.message });
    }
});

// Admin: Update course with image upload
router.put('/:id', protect, adminOnly, upload.single('courseImage'), async (req, res) => {
    try {
        const courseData = JSON.parse(JSON.stringify(req.body));
        
        // Handle price conversion
        if (courseData.price) {
            courseData.price = parseFloat(courseData.price);
        }

        // Handle isActive boolean
        if (courseData.isActive === 'true' || courseData.isActive === true) {
            courseData.isActive = true;
        } else if (courseData.isActive === 'false' || courseData.isActive === false) {
            courseData.isActive = false;
        }

        // Add image path if new file was uploaded
        if (req.file) {
            courseData.image = `/uploads/courses/${req.file.filename}`;
            
            // Delete old image if exists
            const oldCourse = await Course.findById(req.params.id);
            if (oldCourse && oldCourse.image) {
                const oldImagePath = path.join(__dirname, '../../', oldCourse.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        }

        const course = await Course.findByIdAndUpdate(
            req.params.id, 
            courseData, 
            { new: true }
        );
        
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.json(course);
    } catch (err) {
        console.error('Error updating course:', err);
        res.status(500).json({ message: err.message });
    }
});

// Admin: Delete course
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Delete course image if exists
        if (course.image) {
            const imagePath = path.join(__dirname, '../../', course.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;