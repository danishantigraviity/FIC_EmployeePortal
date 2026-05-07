const Document = require('../models/Document.model');
const { calculateCompletion } = require('../utils/profileCompletion');
const driveService = require('../services/drive.service');
const fs = require('fs');
const path = require('path');

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { fieldname, path: localPath, mimetype, filename } = req.file;
    
    const allowedFields = ['aadhaar', 'pan', 'resume', 'profilePhoto', 'tenthCertificate', 'twelfthCertificate', 'degreeProvisional', 'pgProvisional', 'experienceCertificate', 'bankPassbook'];
    if (!allowedFields.includes(fieldname)) {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      return res.status(400).json({ success: false, message: 'Invalid field name' });
    }

    // 1. Upload to Google Drive
    let fileUrl = '';
    let driveId = '';
    
    try {
      const driveResult = await driveService.uploadToDrive(localPath, filename, mimetype);
      if (driveResult) {
        fileUrl = driveResult.viewLink;
        driveId = driveResult.driveId;
      } else {
        // Fallback to local if drive fails (or handle as error)
        throw new Error('Google Drive upload failed');
      }
    } catch (uploadErr) {
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      return res.status(500).json({ success: false, message: 'File storage failed: ' + uploadErr.message });
    }

    // 2. Clean up local file
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);

    // 3. Update Database
    const updateData = {
      [fieldname]: { 
        url: fileUrl, 
        publicId: driveId || filename, 
        uploadedAt: new Date() 
      }
    };
    
    const doc = await Document.findOneAndUpdate(
      { userId: req.user.id }, 
      { ...updateData, userId: req.user.id },
      { new: true, upsert: true }
    );
    
    const { score, steps } = await calculateCompletion(req.user.id);
    res.json({ 
      success: true, 
      data: doc, 
      url: fileUrl, 
      profileCompletion: score, 
      completedSteps: steps 
    });
  } catch (err) { 
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.getDocuments = async (req, res) => {
  const doc = await Document.findOne({ userId: req.user.id });
  res.json({ success: true, data: doc });
};
