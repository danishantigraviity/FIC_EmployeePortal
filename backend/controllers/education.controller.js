const Education = require('../models/Education.model');
const { calculateCompletion } = require('../utils/profileCompletion');

exports.getEducation = async (req, res) => {
  const education = await Education.find({ userId: req.user.id }).sort('-year');
  res.json({ success: true, data: education });
};

exports.addEducation = async (req, res) => {
  try {
    const education = await Education.create({ ...req.body, userId: req.user.id });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.status(201).json({ success: true, data: education, profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateEducation = async (req, res) => {
  try {
    const education = await Education.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body, { new: true }
    );
    if (!education) return res.status(404).json({ success: false, message: 'Not found' });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ success: true, data: education, profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteEducation = async (req, res) => {
  try {
    await Education.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ success: true, message: 'Deleted successfully', profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
