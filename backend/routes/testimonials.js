const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public: Get approved testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ approved: true, visible: true })
      .populate('user', 'name')
      .sort('-createdAt');
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Logged-in user: Submit testimonial
router.post('/', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const testimonial = new Testimonial({
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
      approved: false
    });
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all pending/approved
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().populate('user', 'name email');
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Update approval/visibility
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { approved, visible } = req.body;
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, { approved, visible }, { new: true });
    res.json(testimonial);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;