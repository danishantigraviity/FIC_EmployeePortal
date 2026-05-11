const express = require('express');
const router = express.Router();
const {
  getAllUsers, getUserDetail, verifyUser, getStats,
  getActivityLogs, generateCompiledPdf, syncCompiledPdfToDrive,
  downloadCompiledPdf, deleteUser
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { decodeId } = require('../utils/idHash');

// ── Middleware: decode hashed :id param back to real MongoDB ObjectID ──────────
const resolveHashedId = (req, res, next) => {
  if (req.params.id) {
    try {
      req.params.id = decodeId(req.params.id);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid or tampered resource identifier.' });
    }
  }
  next();
};

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/activity-logs', getActivityLogs);

// All routes that take a :id parameter use the decode middleware
router.get('/user/:id',          resolveHashedId, getUserDetail);
router.put('/verify/:id',        resolveHashedId, verifyUser);
router.delete('/user/:id',       resolveHashedId, deleteUser);
router.post('/compile-pdf/:id',  resolveHashedId, generateCompiledPdf);
router.post('/sync-drive/:id',   resolveHashedId, syncCompiledPdfToDrive);
router.get('/download-pdf/:id',  resolveHashedId, downloadCompiledPdf);

module.exports = router;
