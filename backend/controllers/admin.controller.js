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
const { encodeId } = require('../utils/idHash');

exports.getAllUsers = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, department } = req.query;
    const query = { role: 'employee' };
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }
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
      .limit(parseInt(limit))
      .lean();
    
    // Encode MongoDB _id → hashed ID so raw ObjectIDs never appear in URLs
    const safeUsers = users.map(u => ({
      ...u,
      hashedId: encodeId(u._id.toString())
    }));
    
    res.json({ success: true, data: safeUsers, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
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
    const userObj = user.toObject();
    userObj.hashedId = encodeId(user._id.toString());
    res.json({ success: true, data: { user: userObj, profile, docs, education, experience } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.verifyUser = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, ...(rejectionReason && { rejectionReason }) },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await ActivityLog.create({
      userId: user._id,
      performedBy: req.user.id,
      action: `User ${status}`,
      details: rejectionReason || '',
      ip: req.ip
    });

    // Send email non-blocking — never delay or crash the response
    if (status === 'approved') {
      console.log(`📧 Sending approval email to ${user.email}...`);
      sendApprovalEmail(user.email, user.name)
        .then(() => console.log(`✅ Approval email sent to ${user.email}`))
        .catch(e => console.warn(`⚠️ Approval email failed for ${user.email}:`, e.message));
    } else if (status === 'rejected') {
      console.log(`📧 Sending rejection email to ${user.email}...`);
      sendRejectionEmail(user.email, user.name, rejectionReason)
        .then(() => console.log(`✅ Rejection email sent to ${user.email}`))
        .catch(e => console.warn(`⚠️ Rejection email failed for ${user.email}:`, e.message));
    }

    res.json({ success: true, data: user, message: `Employee ${status} successfully` });
  } catch (err) {
    console.error('🔥 verifyUser failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, approved, pending, rejected, invited, registered] = await Promise.all([
      User.countDocuments({ role: 'employee' }),
      User.countDocuments({ role: 'employee', status: 'approved' }),
      User.countDocuments({ role: 'employee', status: 'pending' }),
      User.countDocuments({ role: 'employee', status: 'rejected' }),
      User.countDocuments({ role: 'employee', status: 'invited' }),
      User.countDocuments({ role: 'employee', status: 'registered' }),
    ]);
    res.json({ success: true, data: { total, approved, pending, rejected, invited, registered } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getActivityLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .populate('userId', 'name email')
      .populate('performedBy', 'name')
      .sort('-createdAt')
      .limit(50)
      .lean();
    
    // Add hashedId to populated users in logs
    const safeLogs = logs.map(log => {
      if (log.userId && log.userId._id) {
        log.userId.hashedId = encodeId(log.userId._id.toString());
      }
      return log;
    });

    res.json({ success: true, data: safeLogs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
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
    console.log('💾 Saving compilation results to database...');
    const updateData = {
      // Use Drive link as primary URL if available for persistence
      url: (driveResult && driveResult.viewLink) ? driveResult.viewLink : localResult.url,
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

    if (!updatedDoc) {
      console.error('❌ Could not find document record to update after compilation');
      return res.status(404).json({ success: false, message: 'Document record not found for update' });
    }

    // Send notification email
    console.log('📧 Sending notification email...');
    const user = await User.findById(id);
    if (user && user.email) {
      await sendPdfReadyEmail(user.email, user.name).catch(e => console.error('⚠️ Email failed:', e.message));
    }

    console.log('✨ Compilation process completed successfully!');
    
    // Return the updated data
    res.json({ 
      success: true, 
      data: updatedDoc.compiledPdf,
      message: 'Documents compiled successfully'
    });
  } catch (err) {
    console.error('🔥 Compilation Pipeline Failed:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to compile documents: ' + err.message 
    });
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

    // 4. Get User details for structured naming & folder
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Sanitize name for filename (e.g., "Danish_P")
    const sanitizedName = user.name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const structuredFileName = `${sanitizedName}_Compiled_Onboarding_Documents.pdf`;

    // 5. Get or Create Employee Folder
    const folderSuffix = user.employeeId || user.email;
    const employeeFolderName = `${sanitizedName} (${folderSuffix})`;
    const employeeFolderId = await driveService.getOrCreateFolder(employeeFolderName);

    // 6. Upload to Drive
    const driveResult = await driveService.uploadToDrive(fullPath, structuredFileName, 'application/pdf', employeeFolderId);

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

exports.downloadCompiledPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const docs = await Document.findOne({ userId: id });

    if (!docs || !docs.compiledPdf) {
      return res.status(404).json({ success: false, message: 'No compiled PDF found for this employee.' });
    }

    const { url, driveId, driveViewLink } = docs.compiledPdf;

    // Build a safe filename from the employee's name
    const user = await User.findById(id).select('name');
    const safeName = (user?.name || 'employee').replace(/\s+/g, '_');
    const fileName = `compiled_docs_${safeName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Strategy 1: Stream directly from Google Drive (most reliable)
    if (driveId) {
      console.log(`📥 Streaming PDF from Google Drive. ID: ${driveId}`);
      try {
        const fileBuffer = await driveService.downloadFromDrive(driveId);
        return res.send(fileBuffer);
      } catch (driveErr) {
        console.warn('⚠️ Drive stream failed, trying local fallback:', driveErr.message);
      }
    }

    // Strategy 2: Serve from local filesystem
    if (url && !url.startsWith('http')) {
      const pathLib = require('path');
      const fs = require('fs');
      const localPath = pathLib.join(__dirname, '../', url.replace(/^\//, ''));
      if (fs.existsSync(localPath)) {
        console.log(`📥 Serving PDF from local storage: ${localPath}`);
        return res.sendFile(localPath);
      }
    }

    // Strategy 3: Redirect to Drive view link as last resort
    if (driveViewLink) {
      console.log('↪️ Redirecting to Google Drive view link as fallback.');
      return res.redirect(driveViewLink);
    }

    return res.status(404).json({ success: false, message: 'PDF file not found in storage or Drive.' });

  } catch (err) {
    console.error('🔥 PDF Download Failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to download PDF: ' + err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // 1. Log activity before deletion
    await ActivityLog.create({
      userId: req.user.id,
      action: `Deleted employee: ${user.name} (${user.email})`,
      details: `Full profile cleanup completed for user ID: ${id}`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // 2. Comprehensive cleanup
    await Promise.all([
      Profile.findOneAndDelete({ userId: id }),
      Document.findOneAndDelete({ userId: id }),
      Education.deleteMany({ userId: id }),
      Experience.deleteMany({ userId: id }),
      User.findByIdAndDelete(id)
    ]);

    res.json({ success: true, message: 'Employee and associated records deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
