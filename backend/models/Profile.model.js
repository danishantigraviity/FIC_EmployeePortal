const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  aadhaarNumber: { type: String, trim: true, unique: true, sparse: true },
  panNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifscCode: String,
  },
  profilePhoto: { type: String },
  isFresher: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
