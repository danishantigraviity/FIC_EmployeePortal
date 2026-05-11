const Profile = require('../models/Profile.model');
const ActivityLog = require('../models/ActivityLog.model');
const { calculateCompletion } = require('../utils/profileCompletion');
const { createBlindIndex } = require('../utils/crypto.utils');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.upsertProfile = async (req, res) => {
  try {
    const { aadhaarNumber, panNumber } = req.body;

    // Strict validation for identity numbers if provided
    if (aadhaarNumber && !/^\d{12}$/.test(aadhaarNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid Aadhaar: Must be 12 digits' });
    }
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }

    // Check for duplicates using Blind Indexing
    if (aadhaarNumber) {
      const idx = createBlindIndex(aadhaarNumber);
      const existingAadhaar = await Profile.findOne({ aadhaarIndex: idx, userId: { $ne: req.user.id } });
      if (existingAadhaar) return res.status(400).json({ success: false, message: 'Aadhaar number already registered with another profile' });
    }
    if (panNumber) {
      const idx = createBlindIndex(panNumber);
      const existingPan = await Profile.findOne({ panIndex: idx, userId: { $ne: req.user.id } });
      if (existingPan) return res.status(400).json({ success: false, message: 'PAN number already registered with another profile' });
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, userId: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );

    // Audit Log
    await ActivityLog.create({
      userId: req.user.id,
      performedBy: req.user.id,
      action: 'Profile Update',
      details: `Updated fields: ${Object.keys(req.body).join(', ')}`,
      ip: req.ip
    });

    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ success: true, data: profile, profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.submitOnboarding = async (req, res) => {
  try {
    const User = require('../models/User.model');
    const { score } = await calculateCompletion(req.user.id);
    
    if (score < 100) {
      return res.status(400).json({ success: false, message: 'Please complete all steps to 100% before submitting.' });
    }

    const user = await User.findByIdAndUpdate(req.user.id, 
      { status: 'pending' },
      { new: true }
    );

    res.json({ success: true, message: 'Profile submitted successfully for HR review.', status: user.status });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
