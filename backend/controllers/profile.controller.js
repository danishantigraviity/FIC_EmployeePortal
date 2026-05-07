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
