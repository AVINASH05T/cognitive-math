const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { protect } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
router.post('/create-order', protect, async (req, res) => {
    try {
        const { courseId } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.price === 0) {
            return res.status(400).json({ message: 'Course is free' });
        }

        // Check if already registered
        const existing = await Registration.findOne({ 
            user: req.user._id, 
            course: courseId 
        });
        
        if (existing) {
            return res.status(400).json({ message: 'Already registered' });
        }

        // Create Razorpay order
        const options = {
            amount: course.price * 100, // amount in paise
            currency: 'INR',
            receipt: `course_${courseId}_${Date.now()}`,
            notes: {
                courseId: courseId,
                userId: req.user._id.toString()
            }
        };

        const order = await razorpay.orders.create(options);

        // Save payment record
        const payment = new Payment({
            user: req.user._id,
            course: courseId,
            amount: course.price,
            paymentIntentId: order.id,
            status: 'pending'
        });
        await payment.save();

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            course: course
        });
    } catch (err) {
        console.error('Razorpay error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Verify payment
router.post('/verify', protect, async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            courseId 
        } = req.body;

        // Verify signature (you need to implement this)
        const crypto = require('crypto');
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Update payment
        await Payment.findOneAndUpdate(
            { paymentIntentId: razorpay_order_id },
            { 
                status: 'succeeded',
                paymentMethod: 'razorpay'
            }
        );

        // Create registration
        const registration = new Registration({
            user: req.user._id,
            course: courseId,
            paymentStatus: 'paid',
            paymentId: razorpay_payment_id,
            amountPaid: req.body.amount / 100
        });
        await registration.save();

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { registeredCourses: courseId }
        });

        res.json({ 
            success: true, 
            message: 'Payment verified and registration complete'
        });
    } catch (err) {
        console.error('Verification error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;