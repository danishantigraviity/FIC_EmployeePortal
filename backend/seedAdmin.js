const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const adminExists = await User.findOne({ email: 'admin@fic.com' });
    if (adminExists) {
      console.log('ℹ️ Admin user already exists');
    } else {
      await User.create({
        name: 'Super Admin',
        email: 'admin@fic.com',
        password: 'adminPassword123',
        role: 'admin',
        isRegistered: true,
        status: 'approved'
      });
      console.log('✅ Admin user created successfully');
      console.log('Email: admin@fic.com');
      console.log('Password: adminPassword123');
    }
  } catch (err) {
    console.error('❌ Error seeding admin:', err);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedAdmin();
