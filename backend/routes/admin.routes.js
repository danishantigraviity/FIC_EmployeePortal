const express = require('express');
const router = express.Router();
const { getAllUsers, getUserDetail, verifyUser, getStats, getActivityLogs, generateCompiledPdf, syncCompiledPdfToDrive, downloadCompiledPdf, deleteUser } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/user/:id', getUserDetail);
router.put('/verify/:id', verifyUser);
router.delete('/user/:id', deleteUser);
router.get('/activity-logs', getActivityLogs);
router.post('/compile-pdf/:id', generateCompiledPdf);
router.post('/sync-drive/:id', syncCompiledPdfToDrive);
router.get('/download-pdf/:id', downloadCompiledPdf);

module.exports = router;
