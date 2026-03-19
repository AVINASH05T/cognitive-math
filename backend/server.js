const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/registrations', require('./routes/registration'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/site-content', require('./routes/siteContent'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/users', require('./routes/users'));
// Add this with your other routes
app.use('/api/upload', require('./routes/upload'));
// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
    }
});

const PORT = process.env.PORT || 5000;

// Create default admin user if none exists
async function createDefaultAdmin() {
    try {
        const User = require('./models/User');
        const bcrypt = require('bcryptjs');
        
        const adminExists = await User.findOne({ email: 'admin@cognitive.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('staff_2026_1', 10);
            const admin = new User({
                name: 'Admin',
                email: 'admin@cognitive.com',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Default admin created');
        }
    } catch (err) {
        console.error('Error creating default admin:', err);
    }
}

// Create default site content if none exists
async function createDefaultContent() {
    try {
        const SiteContent = require('./models/SiteContent');
        
        const contentExists = await SiteContent.findOne();
        if (!contentExists) {
            const defaultContent = new SiteContent({
                logo: '',
                hero: {
                    tagline: 'Strengthening Math Through Cognitive Learning'
                },
                stats: [
                    { label: 'Students', value: '100+', image: 'https://img.icons8.com/fluency/96/000000/student-male.png' },
                    { label: 'Courses', value: '10+', image: 'https://img.icons8.com/fluency/96/000000/online-learning.png' },
                    { label: 'Teachers', value: '20+', image: 'https://img.icons8.com/fluency/96/000000/teacher.png' },
                    { label: 'Rating', value: '4.9', image: 'https://img.icons8.com/fluency/96/000000/star.png' }
                ],
                teachers: [
                    { name: 'Eswari', qualification: 'Math Expert', image: 'https://img.icons8.com/fluency/96/000000/teacher.png' },
                    { name: 'Rajesh', qualification: 'Algebra Specialist', image: 'https://img.icons8.com/fluency/96/000000/teacher.png' }
                ],
                aboutSections: [
                    { title: 'Cognitive Approach', description: 'We use proven cognitive learning techniques to make math concepts stick.', icon: 'fa-brain' },
                    { title: 'Individual Attention', description: 'Small class sizes ensure every student gets the attention they deserve.', icon: 'fa-users' },
                    { title: 'Track Progress', description: 'Regular assessments and feedback to monitor improvement.', icon: 'fa-chart-line' }
                ],
                contact: {
                    phone: '+91 98765 43210',
                    email: 'info@cognitivemath.com'
                },
                socialLinks: {
                    facebook: { url: '#', visible: true },
                    twitter: { url: '#', visible: true },
                    instagram: { url: '#', visible: true },
                    youtube: { url: '#', visible: true },
                    linkedin: { url: '#', visible: false }
                }
            });
            await defaultContent.save();
            console.log('✅ Default site content created');
        }
    } catch (err) {
        console.error('Error creating default content:', err);
    }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cognitive-math')
    .then(async () => {
        console.log('✅ MongoDB connected successfully');
        
        // Create default data
        await createDefaultAdmin();
        await createDefaultContent();
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure MongoDB is installed and running');
        console.log('2. Run "net start MongoDB" in admin command prompt');
        console.log('3. Or start manually: "C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe"');
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
});