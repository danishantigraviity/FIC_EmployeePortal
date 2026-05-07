const express = require('express');
const router = express.Router();
const { 
  createInvite, validateToken, register, login, 
  forgotPassword, resetPassword,
  refreshToken, logout, getMe 
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { validateBody, schemas } = require('../middleware/validate.middleware');

router.post('/invite', protect, authorize('admin'), createInvite);
router.get('/validate-token', validateToken);
router.post('/register', validateBody(schemas.register), register);
router.post('/login', validateBody(schemas.login), login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
