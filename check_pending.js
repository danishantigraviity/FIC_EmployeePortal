const mongoose = require('mongoose');
const User = require('./backend/models/User.model');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const pending = await User.find({ status: 'pending' });
  console.log('Pending users:', pending.length);
  pending.forEach(u => console.log(`- ${u.name} (${u.email})`));
  
  const all = await User.find({ role: 'employee' });
  console.log('Total employees:', all.length);
  const statusCounts = all.reduce((acc, u) => {
    acc[u.status] = (acc[u.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Status breakdown:', statusCounts);
  
  await mongoose.disconnect();
}

check();
