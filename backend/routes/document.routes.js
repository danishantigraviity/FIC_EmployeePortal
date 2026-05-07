const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments } = require('../controllers/document.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

router.use(protect);
router.get('/', getDocuments);
router.post('/upload/aadhaar', upload.single('aadhaar'), uploadDocument);
router.post('/upload/pan', upload.single('pan'), uploadDocument);
router.post('/upload/resume', upload.single('resume'), uploadDocument);
router.post('/upload/profilePhoto', upload.single('profilePhoto'), uploadDocument);
router.post('/upload/tenthCertificate', upload.single('tenthCertificate'), uploadDocument);
router.post('/upload/twelfthCertificate', upload.single('twelfthCertificate'), uploadDocument);
router.post('/upload/degreeProvisional', upload.single('degreeProvisional'), uploadDocument);
router.post('/upload/pgProvisional', upload.single('pgProvisional'), uploadDocument);
router.post('/upload/experienceCertificate', upload.single('experienceCertificate'), uploadDocument);
router.post('/upload/bankPassbook', upload.single('bankPassbook'), uploadDocument);

module.exports = router;
