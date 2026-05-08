const mongoose = require('mongoose');
const User = require('./models/User.model');
require('dotenv').config();

const seedEmployee = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if employee exists
    let employee = await User.findOne({ email: 'employee@fic.com' });
    
    if (!employee) {
      employee = await User.create({
        name: 'Dhanush Test',
        email: 'employee@fic.com',
        password: 'employee123',
        role: 'employee',
        isRegistered: true,
        status: 'registered',
        profileCompletion: 20
      });
      console.log('✅ Dummy Employee Created');
    } else {
      console.log('ℹ️ Dummy Employee already exists');
    }

    console.log('\n--- DUMMY PORTAL ACCESS ---');
    console.log(`Link: ${process.env.CLIENT_URL || 'http://localhost:5173'}/login`);
    console.log('Email: employee@fic.com');
    console.log('Password: employee123');
    console.log('----------------------------\n');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
};

seedEmployee();
