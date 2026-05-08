const mongoose = require('mongoose');
const User = require('./models/User.model');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const createFinalAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const adminEmail = 'superadmin@fic.com';
    const adminPassword = 'FicAdmin@2026';

    // Delete any existing user with this email to ensure a fresh start
    await User.deleteOne({ email: adminEmail });

    // Create the fresh admin
    await User.create({
      name: 'FIC Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isRegistered: true,
      status: 'approved'
    });

    console.log('🚀 Final Admin Created Successfully!');
    console.log('-----------------------------------');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-----------------------------------');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

createFinalAdmin();
