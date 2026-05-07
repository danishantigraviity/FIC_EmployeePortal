const Experience = require('../models/Experience.model');
const { calculateCompletion } = require('../utils/profileCompletion');
const driveService = require('../services/drive.service');
const fs = require('fs');

exports.getExperience = async (req, res) => {
  const experience = await Experience.find({ userId: req.user.id }).sort('-startYear');
  res.json({ success: true, data: experience });
};

exports.addExperience = async (req, res) => {
  try {
    const exp = await Experience.create({ ...req.body, userId: req.user.id });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.status(201).json({ success: true, data: exp, profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.updateExperience = async (req, res) => {
  try {
    const exp = await Experience.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, req.body, { new: true }
    );
    if (!exp) return res.status(404).json({ success: false, message: 'Not found' });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ success: true, data: exp, profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteExperience = async (req, res) => {
  try {
    await Experience.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ success: true, message: 'Deleted', profileCompletion: score, completedSteps: steps });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.uploadExperienceCertificate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { path: localPath, mimetype, filename } = req.file;
    
    // 1. Upload to Google Drive
    let fileUrl = '';
    try {
      const driveResult = await driveService.uploadToDrive(localPath, filename, mimetype);
      if (driveResult) {
        fileUrl = driveResult.viewLink;
      } else {
        throw new Error('Google Drive upload failed');
      }
    } catch (uploadErr) {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      return res.status(500).json({ success: false, message: 'File storage failed: ' + uploadErr.message });
    }

    // 2. Clean up local file
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    
    res.json({ success: true, url: fileUrl });
  } catch (err) { 
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message }); 
  }
};
