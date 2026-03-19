const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Student: Get own profile
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

// Student: Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, standard, parentPhone, dob, achievements } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (standard) user.standard = standard;
    if (parentPhone) user.parentPhone = parentPhone;
    if (dob) user.dob = dob;
    if (achievements) user.achievements = achievements;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all users
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Delete user
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find().select('name points profileImage').sort({ points: -1 }).limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;