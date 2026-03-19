const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, standard, parentPhone, dob } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            standard,
            parentPhone,
            dob,
            role: 'student' // Default role
        });
        
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        
        // Always return success for security
        if (!user) {
            return res.json({ message: 'If the email exists, a reset link will be sent.' });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET + user.password,
            { expiresIn: '1h' }
        );

        // Save reset token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
        await user.save();

        // Create reset URL
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
        
        console.log('🔐 Reset URL:', resetUrl);
        
        // TODO: Send email with nodemailer
        // await sendEmail({
        //   to: user.email,
        //   subject: 'Password Reset - Cognitive Math',
        //   html: `Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.`
        // });

        res.json({ 
            message: 'If the email exists, a reset link will be sent.',
            // Remove in production
            debug: { resetUrl }
        });

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Error processing request' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        // Decode token to get user ID
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.id) {
            return res.status(400).json({ message: 'Invalid reset token' });
        }

        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Verify token
        try {
            jwt.verify(token, process.env.JWT_SECRET + user.password);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Check if token is expired
        if (user.resetTokenExpiry && user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ message: 'Reset token expired' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({ message: 'Password reset successful' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Register - Make sure this accepts role parameter
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, standard, parentPhone, dob, role } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user - use provided role or default to 'student'
        const userRole = role || 'student';
        
        const user = new User({
            name,
            email,
            password: hashedPassword,
            standard,
            parentPhone,
            dob,
            role: userRole  // This is crucial!
        });
        
        await user.save();

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Change password (authenticated)
router.post('/change-password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        const user = await User.findById(req.user._id);
        
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ message: 'Error changing password' });
    }
});

module.exports = router;