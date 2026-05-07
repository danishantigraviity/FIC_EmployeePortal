const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  degree: { type: String, required: true, trim: true },
  college: { type: String, required: true, trim: true },
  university: { type: String, trim: true },
  year: { type: Number, required: true },
  percentage: { type: Number, min: 0, max: 100 },
  specialization: { type: String, trim: true },
}, { timestamps: true });

module.exports = mongoose.model('Education', educationSchema);
