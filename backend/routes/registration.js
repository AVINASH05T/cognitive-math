const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Student: Register for a course (after payment)
router.post('/', protect, async (req, res) => {
  try {
    const { courseId, paymentId, amount } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existing = await Registration.findOne({ user: req.user._id, course: courseId });
    if (existing) return res.status(400).json({ message: 'Already registered' });

    const registration = new Registration({
      user: req.user._id,
      course: courseId,
      paymentStatus: amount > 0 ? 'paid' : 'pending',
      paymentId,
      amountPaid: amount
    });
    await registration.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { registeredCourses: courseId } });

    res.status(201).json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all registrations for a course
router.get('/course/:courseId', protect, adminOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({ course: req.params.courseId })
      .populate('user', 'name email parentPhone standard')
      .populate('course', 'title zoomLink');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Mark attendance
router.put('/:regId/attendance', protect, adminOnly, async (req, res) => {
  try {
    const { attended } = req.body;
    const reg = await Registration.findById(req.params.regId).populate('user');
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    reg.attended = attended;
    if (attended && !reg.completed) {
      reg.completed = true;
      await User.findByIdAndUpdate(reg.user._id, { 
        $inc: { points: 200 }, 
        $addToSet: { completedCourses: reg.course } 
      });
    }
    await reg.save();
    res.json(reg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student: Get my upcoming/completed courses
router.get('/my', protect, async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate('course')
      .sort({ registeredAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Export registrations to CSV
router.get('/export/:courseId', protect, adminOnly, async (req, res) => {
  try {
    const registrations = await Registration.find({ course: req.params.courseId })
      .populate('user', 'name email parentPhone standard')
      .populate('course', 'title');
    
    if (!registrations.length) {
      return res.status(404).json({ message: 'No registrations found' });
    }

    // Create CSV header
    let csv = 'Name,Email,Phone,Grade,Payment Status,Attended,Registered Date\n';
    
    // Add rows
    registrations.forEach(reg => {
      csv += `"${reg.user.name}","${reg.user.email}","${reg.user.parentPhone || ''}","${reg.user.standard || ''}","${reg.paymentStatus}","${reg.attended ? 'Yes' : 'No'}","${new Date(reg.registeredAt).toLocaleDateString()}"\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=course-${req.params.courseId}-students.csv`);
    
    res.send(csv);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;