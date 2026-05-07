const User = require('../models/User.model');
const Profile = require('../models/Profile.model');
const Document = require('../models/Document.model');
const Education = require('../models/Education.model');
const Experience = require('../models/Experience.model');
const { 
  sendApprovalEmail, 
  sendRejectionEmail, 
  sendPdfReadyEmail, 
  sendDriveSyncEmail 
} = require('../utils/email.utils');
const ActivityLog = require('../models/ActivityLog.model');
const pdfService = require('../services/pdf.service');
const driveService = require('../services/drive.service');

exports.getAllUsers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, department } = req.query;
    const query = { role: 'employee' };
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokens')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const [profile, docs, education, experience] = await Promise.all([
      Profile.findOne({ userId: req.params.id }),
      Document.findOne({ userId: req.params.id }),
      Education.find({ userId: req.params.id }),
      Experience.find({ userId: req.params.id }),
    ]);
    res.json({ success: true, data: { user, profile, docs, education, experience } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.verifyUser = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const user = await User.findByIdAndUpdate(req.params.id,
      { status, ...(rejectionReason && { rejectionReason }) },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await ActivityLog.create({ userId: user._id, performedBy: req.user.id, action: `User ${status}`, details: rejectionReason || '', ip: req.ip });
    
    if (status === 'approved') {
      await sendApprovalEmail(user.email, user.name);
    } else if (status === 'rejected') {
      await sendRejectionEmail(user.email, user.name, rejectionReason);
    }

    res.json({ success: true, data: user, message: `Employee ${status} successfully` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, approved, pending, rejected, invited] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', status: 'approved' }),
      User.countDocuments({ role: 'employee', status: 'pending' }),
      User.countDocuments({ role: 'employee', status: 'rejected' }),
      User.countDocuments({ role: 'employee', status: 'invited' }),
    ]);
    res.json({ success: true, data: { total, approved, pending, rejected, invited } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getActivityLogs = async (req, res) => {
  const logs = await ActivityLog.find().populate('userId', 'name email').populate('performedBy', 'name').sort('-createdAt').limit(50);
  res.json({ success: true, data: logs });
};

exports.generateCompiledPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const docs = await Document.findOne({ userId: id });
    if (!docs) return res.status(404).json({ success: false, message: 'Documents not found' });

    // 1. Generate local PDF
    const localResult = await pdfService.generateCompiledPdf(docs, id);

    // 2. Upload to Drive (async/optional based on config)
    let driveResult = null;
    try {
      driveResult = await driveService.uploadToDrive(localResult.path, localResult.fileName);
    } catch (driveErr) {
      console.warn('Drive upload failed, but local PDF is ready:', driveErr.message);
    }

    // 3. Update DB
    const updateData = {
      url: localResult.url,
      generatedAt: new Date(),
      ...(driveResult && { 
        driveId: driveResult.driveId, 
        driveViewLink: driveResult.viewLink 
      })
    };

    const updatedDoc = await Document.findOneAndUpdate(
      { userId: id },
      { compiledPdf: updateData },
      { new: true }
    );

    // Send notification email
    const user = await User.findById(id);
    if (user) {
      await sendPdfReadyEmail(user.email, user.name).catch(e => console.error('Email failed:', e.message));
    }

    res.json({ 
      success: true, 
      data: updatedDoc.compiledPdf,
      message: 'Documents compiled successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.syncCompiledPdfToDrive = async (req, res) => {
  try {
    const { id } = req.params;
    const docs = await Document.findOne({ userId: id });
    
    if (!docs || !docs.compiledPdf || !docs.compiledPdf.url) {
      return res.status(400).json({ success: false, message: 'No compiled PDF found to sync' });
    }

    // Resolve local path
    const path = require('path');
    const fs = require('fs/promises');
    const relativePath = docs.compiledPdf.url.replace(/^\//, ''); // Remove leading slash
    const fullPath = path.join(__dirname, '../', relativePath);

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch (err) {
      return res.status(404).json({ success: false, message: 'Local PDF file not found on server' });
    }

    // Upload to Drive
    const fileName = path.basename(fullPath);
    const driveResult = await driveService.uploadToDrive(fullPath, fileName);

    if (!driveResult) {
      throw new Error('Drive upload failed - no result returned');
    }

    // Update DB
    const updatedDoc = await Document.findOneAndUpdate(
      { userId: id },
      { 
        'compiledPdf.driveId': driveResult.driveId,
        'compiledPdf.driveViewLink': driveResult.viewLink
      },
      { new: true }
    );

    // Send notification email
    const user = await User.findById(id);
    if (user) {
      await sendDriveSyncEmail(user.email, user.name, driveResult.viewLink).catch(e => console.error('Email failed:', e.message));
    }

    res.json({
      success: true,
      data: updatedDoc.compiledPdf,
      message: 'Successfully synced to Google Drive'
    });
  } catch (err) {
    console.error('Sync to Drive failed:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
