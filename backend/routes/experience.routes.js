const express = require('express');
const router = express.Router();
const { getExperience, addExperience, updateExperience, deleteExperience, uploadExperienceCertificate } = require('../controllers/experience.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../config/upload');

router.use(protect);
router.get('/', getExperience);
router.post('/', addExperience);
router.post('/upload', upload.single('certificate'), uploadExperienceCertificate);
router.put('/:id', updateExperience);
router.delete('/:id', deleteExperience);

module.exports = router;
