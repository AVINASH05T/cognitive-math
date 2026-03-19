const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/authMiddleware');
const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Registration = require('../models/Registration');
const User = require('../models/User');

// Create payment intent
router.post('/create-payment-intent', protect, async (req, res) => {
    try {
        const { courseId } = req.body;
        
        // Get course details
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
            return res.status(400).json({ message: 'Already registered for this course' });
        }

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(course.price * 100), // Convert to paise
            currency: 'inr',
            metadata: {
                courseId: courseId,
                userId: req.user._id.toString(),
                courseName: course.title
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        // Save payment record
        const payment = new Payment({
            user: req.user._id,
            course: courseId,
            amount: course.price,
            paymentIntentId: paymentIntent.id,
            status: 'pending'
        });
        await payment.save();

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentId: payment._id
        });
    } catch (err) {
        console.error('Payment error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Confirm payment and complete registration
router.post('/confirm', protect, async (req, res) => {
    try {
        const { paymentIntentId, courseId } = req.body;

        // Verify payment with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ message: 'Payment not successful' });
        }

        // Update payment record
        await Payment.findOneAndUpdate(
            { paymentIntentId },
            { 
                status: 'succeeded',
                receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
            }
        );

        // Create registration
        const registration = new Registration({
            user: req.user._id,
            course: courseId,
            paymentStatus: 'paid',
            paymentId: paymentIntentId,
            amountPaid: paymentIntent.amount / 100
        });
        await registration.save();

        // Add course to user's registered courses
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { registeredCourses: courseId }
        });

        res.json({ 
            success: true, 
            message: 'Payment confirmed and registration complete',
            registration 
        });
    } catch (err) {
        console.error('Confirmation error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get payment history for user
router.get('/history', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id })
            .populate('course', 'title grade price')
            .sort('-createdAt');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all payments (admin only)
router.get('/all', protect, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin' && req.user.role !== 'editor') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const payments = await Payment.find()
            .populate('user', 'name email')
            .populate('course', 'title grade')
            .sort('-createdAt');
        res.json(payments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Webhook to handle Stripe events (optional but recommended)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            await handleSuccessfulPayment(paymentIntent);
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            await handleFailedPayment(failedPayment);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

async function handleSuccessfulPayment(paymentIntent) {
    const { courseId, userId } = paymentIntent.metadata;
    
    // Update payment
    await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { 
            status: 'succeeded',
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
        }
    );

    // Check if already registered
    const existing = await Registration.findOne({ 
        user: userId, 
        course: courseId 
    });
    
    if (!existing) {
        // Create registration
        const registration = new Registration({
            user: userId,
            course: courseId,
            paymentStatus: 'paid',
            paymentId: paymentIntent.id,
            amountPaid: paymentIntent.amount / 100
        });
        await registration.save();

        // Add course to user's registered courses
        await User.findByIdAndUpdate(userId, {
            $addToSet: { registeredCourses: courseId }
        });
        
        console.log(`Registration created for user ${userId} in course ${courseId}`);
    }
}

async function handleFailedPayment(paymentIntent) {
    // Update payment status
    await Payment.findOneAndUpdate(
        { paymentIntentId: paymentIntent.id },
        { status: 'failed' }
    );
    
    console.log(`Payment failed for intent: ${paymentIntent.id}`);
}

module.exports = router;