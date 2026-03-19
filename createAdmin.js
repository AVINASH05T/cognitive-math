const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./backend/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const hashedPassword = await bcrypt.hash('staff_2026_1', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@cognitive.com',
      password: hashedPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Admin created successfully');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });