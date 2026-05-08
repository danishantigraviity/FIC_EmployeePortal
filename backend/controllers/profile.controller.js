const Profile = require('../models/Profile.model');
const { calculateCompletion } = require('../utils/profileCompletion');

exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    res.json({ success: true, data: profile });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.upsertProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, userId: req.user.id },
      { new: true, upsert: true, runValidators: true }
    );
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
