const express = require('express');
const router = express.Router();
const { getProfile, upsertProfile } = require('../controllers/profile.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateBody, schemas } = require('../middleware/validate.middleware');

router.use(protect);
router.get('/', getProfile);
router.post('/', validateBody(schemas.profile), upsertProfile);
router.put('/', validateBody(schemas.profile), upsertProfile);

module.exports = router;
