const Document = require('../models/Document.model');
const { calculateCompletion } = require('../utils/profileCompletion');
const driveService = require('../services/drive.service');
const { validateIdentityDocument } = require('../utils/documentValidator');
const fs = require('fs');
const path = require('path');

const ALLOWED_FIELDS = [
  'aadhaar', 'pan', 'resume', 'profilePhoto',
  'tenthCertificate', 'twelfthCertificate',
  'degreeProvisional', 'pgProvisional',
  'experienceCertificate', 'bankPassbook'
];

// Fields that require identity document validation
const IDENTITY_FIELDS = ['aadhaar', 'pan'];

exports.uploadDocument = async (req, res) => {
  let localPath = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { fieldname, path: filePath, mimetype, filename } = req.file;
    localPath = filePath;

    // ── 1. Field name whitelist ──────────────────────────────────────────────
    if (!ALLOWED_FIELDS.includes(fieldname)) {
      fs.existsSync(localPath) && fs.unlinkSync(localPath);
      return res.status(400).json({ success: false, message: 'Invalid document field name' });
    }

    // ── 2. Require profile number before identity doc upload ─────────────────
    let expectedNumber = null;
    if (IDENTITY_FIELDS.includes(fieldname)) {
      const Profile = require('../models/Profile.model');
      const profile = await Profile.findOne({ userId: req.user.id });

      if (!profile) {
        fs.existsSync(localPath) && fs.unlinkSync(localPath);
        return res.status(400).json({
          success: false,
          message: 'Please complete Step 1 (Profile) before uploading identity documents.'
        });
      }

      if (fieldname === 'aadhaar') {
        if (!profile.aadhaarNumber) {
          fs.existsSync(localPath) && fs.unlinkSync(localPath);
          return res.status(400).json({
            success: false,
            message: 'Please save your Aadhaar number in Step 1 (Profile) before uploading the Aadhaar Card.'
          });
        }
        expectedNumber = profile.aadhaarNumber;
      }

      if (fieldname === 'pan') {
        if (!profile.panNumber) {
          fs.existsSync(localPath) && fs.unlinkSync(localPath);
          return res.status(400).json({
            success: false,
            message: 'Please save your PAN number in Step 1 (Profile) before uploading the PAN Card.'
          });
        }
        expectedNumber = profile.panNumber;
      }
    }

    // ── 3. Run intelligent document validation for identity docs ─────────────
    if (IDENTITY_FIELDS.includes(fieldname)) {
      const validation = await validateIdentityDocument({
        filePath: localPath,
        mimetype,
        fieldname,
        expectedNumber
      });

      if (!validation.valid) {
        fs.existsSync(localPath) && fs.unlinkSync(localPath);
        return res.status(422).json({
          success: false,
          message: validation.message,
          validationError: true
        });
      }
    }

    // ── 4. Upload to Google Drive ─────────────────────────────────────────────
    let fileUrl = '';
    let driveId = '';

    try {
      const driveResult = await driveService.uploadToDrive(localPath, filename, mimetype);
      if (driveResult) {
        fileUrl = driveResult.viewLink;
        driveId = driveResult.driveId;
      } else {
        throw new Error('Google Drive upload returned empty result');
      }
    } catch (uploadErr) {
      fs.existsSync(localPath) && fs.unlinkSync(localPath);
      return res.status(500).json({ success: false, message: 'File storage failed: ' + uploadErr.message });
    }

    // ── 5. Clean up local temp file ───────────────────────────────────────────
    fs.existsSync(localPath) && fs.unlinkSync(localPath);

    // ── 6. Persist to database ────────────────────────────────────────────────
    const updateData = {
      [fieldname]: {
        url: fileUrl,
        publicId: driveId || filename,
        uploadedAt: new Date(),
        validated: IDENTITY_FIELDS.includes(fieldname)
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
      completedSteps: steps,
      validated: IDENTITY_FIELDS.includes(fieldname)
    });

  } catch (err) {
    // Final safety cleanup
    if (localPath && fs.existsSync(localPath)) fs.unlinkSync(localPath);
    console.error('[uploadDocument] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDocuments = async (req, res) => {
  const doc = await Document.findOne({ userId: req.user.id });
  res.json({ success: true, data: doc });
};
