const Document = require('../models/Document.model');
const { calculateCompletion } = require('../utils/profileCompletion');
const driveService = require('../services/drive.service');
const { validateIdentityDocument } = require('../utils/documentValidator');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

    // ── 4. Image Optimization & Drive Upload ──────────────────────────────────
    let fileUrl = '';
    let driveId = '';
    let uploadPath = localPath;
    let isOptimized = false;

    try {
      // Optimize images before upload to save space and improve performance
      if (mimetype.startsWith('image/') && fieldname !== 'resume') {
        const optimizedName = `opt_${filename}`;
        const optimizedPath = path.join(path.dirname(localPath), optimizedName);
        
        const transformer = sharp(localPath);
        const metadata = await transformer.metadata();
        
        // Resize if too large (max width 1600px)
        if (metadata.width > 1600) {
          transformer.resize(1600);
        }

        // Special handling for profile photo: crop to square
        if (fieldname === 'profilePhoto') {
          transformer.resize(400, 400, { fit: 'cover' });
        }

        await transformer
          .jpeg({ quality: 80, progressive: true, mozjpeg: true }) // Standardize to high-quality compressed JPEG
          .toFile(optimizedPath);
        
        uploadPath = optimizedPath;
        isOptimized = true;
      }

      const driveResult = await driveService.uploadToDrive(uploadPath, filename, isOptimized ? 'image/jpeg' : mimetype);
      
      if (driveResult) {
        fileUrl = driveResult.viewLink;
        driveId = driveResult.driveId;
      } else {
        throw new Error('Google Drive upload returned empty result');
      }

      // Cleanup optimized temp file if created
      if (isOptimized && fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    } catch (uploadErr) {
      if (isOptimized && fs.existsSync(uploadPath)) fs.unlinkSync(uploadPath);
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
