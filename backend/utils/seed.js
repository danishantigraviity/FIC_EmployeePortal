/**
 * Seed script — creates initial admin user
 * Run: node utils/seed.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const User = require('../models/User.model');

  await User.deleteMany({ email: 'admin@forge.in' });

  await User.create({
    name: 'HR Admin',
    email: 'admin@forge.in',
    password: 'Admin@1234',
    role: 'admin',
    isRegistered: true,
    status: 'approved',
    profileCompletion: 100
  });
  console.log('✅ Admin created: admin@forge.in / Admin@1234');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
