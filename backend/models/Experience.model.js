const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyName: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true },
  startYear: { type: Number },
  endYear: { type: Number },
  years: { type: Number },
  skills: [{ type: String, trim: true }],
  description: { type: String, trim: true },
  idCard: { type: String, trim: true },
  portfolio: { type: String, trim: true },
  certificateUrl: { type: String },
  isCurrent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Experience', experienceSchema);
