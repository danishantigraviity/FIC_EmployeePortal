const express = require('express');
const router = express.Router();
const { getEducation, addEducation, updateEducation, deleteEducation } = require('../controllers/education.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateBody, schemas } = require('../middleware/validate.middleware');

router.use(protect);
router.get('/', getEducation);
router.post('/', validateBody(schemas.education), addEducation);
router.put('/:id', updateEducation);
router.delete('/:id', deleteEducation);

module.exports = router;
