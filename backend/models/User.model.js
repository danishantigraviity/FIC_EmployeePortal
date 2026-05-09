const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, minlength: 8 },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  status: { type: String, enum: ['invited', 'registered', 'pending', 'approved', 'rejected'], default: 'invited' },
  registrationToken: { type: String },
  registrationTokenExpiry: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  isRegistered: { type: Boolean, default: false },
  refreshTokens: [{ type: String }],
  profileCompletion: { type: Number, default: 0 },
  completedSteps: {
    profile: { type: Boolean, default: false },
    education: { type: Boolean, default: false },
    experience: { type: Boolean, default: false },
    documents: { type: Boolean, default: false },
    bank: { type: Boolean, default: false },
  },
  department: { type: String },
  employeeId: { type: String, unique: true, sparse: true },
  joiningDate: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.registrationToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
