const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { sendTokens, generateAccessToken, generateRefreshToken } = require('../utils/jwt.utils');
const { 
  sendRegistrationEmail, 
  sendPasswordResetEmail,
  sendOTPEmail 
} = require('../utils/email.utils');
const crypto = require('crypto');

exports.createInvite = async (req, res) => {
  try {
    const { name, email, phone, department } = req.body;
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isRegistered) {
        return res.status(400).json({ success: false, message: 'Employee with this email is already registered' });
      }
      // If invited but not registered, we allow re-sending the invite
      console.log(`🔄 Re-sending invite to: ${email}`);
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    if (user) {
      user.registrationToken = token;
      user.registrationTokenExpiry = expiry;
      user.name = name; // Update name/phone if changed
      user.phone = phone;
      user.department = department;
      await user.save();
    } else {
      user = await User.create({
        name, email, phone, department,
        registrationToken: token,
        registrationTokenExpiry: expiry,
        role: 'employee', status: 'invited'
      });
    }

    // NON-BLOCKING BACKGROUND EMAIL
    // We return success to the admin immediately, while sending the email in the background.
    console.log(`🚀 Triggering background invite email for ${email}...`);
    
    sendRegistrationEmail(email, name, token).catch(err => {
      console.error(`❌ Background Email Error for ${email}:`, err.message);
      // In a real production app, we might log this to a DB or notification service
    });

    res.status(200).json({
      success: true,
      message: 'Invitation generated successfully. Email is being sent in the background.',
      data: { 
        userId: user._id, 
        registrationUrl: `${process.env.CLIENT_URL}/register?token=${token}`,
        emailWarning: false
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateToken = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await User.findOne({ registrationToken: token, isRegistered: false });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or already used token' });
    if (user.registrationTokenExpiry < new Date()) return res.status(400).json({ success: false, message: 'Registration link has expired' });
    res.json({ success: true, data: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { token, phone, password } = req.body;
    const user = await User.findOne({ registrationToken: token, isRegistered: false });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or used token' });
    if (user.registrationTokenExpiry < new Date()) return res.status(400).json({ success: false, message: 'Token expired' });

    user.phone = phone;
    user.password = password;
    user.isRegistered = true;
    user.status = 'registered';
    user.registrationToken = undefined;
    user.registrationTokenExpiry = undefined;
    await user.save();

    sendTokens(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isRegistered) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const { generateAccessToken, generateRefreshToken: genRefresh } = require('../utils/jwt.utils');
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = genRefresh(user._id);
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    // SameSite=None + Secure=true required for cross-site Vercel→Render
    const cookieOpts = { httpOnly: true, secure: true, sameSite: 'none', path: '/' };
    res.cookie('accessToken', accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.status, 
        profileCompletion: user.profileCompletion, 
        completedSteps: user.completedSteps,
        rejectionReason: user.rejectionReason 
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    
    // Check if token exists in user's valid tokens
    if (!user || !user.refreshTokens.includes(token)) {
      // Possible token reuse attack! Invalidate ALL tokens for this user for safety
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token - security alert' });
    }

    // ROTATION: Remove old token, generate new ones
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    
    const { sendTokens } = require('../utils/jwt.utils');
    // sendTokens will generate new Access & Refresh tokens, 
    // set cookies, and save the new refresh token to the user object if we modify it first.
    // However, sendTokens doesn't save to DB. We need to do that manually or adjust sendTokens.
    
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);
    
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    };

    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Refresh token invalid' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { refreshTokens: token } });
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      // To prevent email enumeration, we return success even if user not found, 
      // but in this internal portal, showing "not found" is usually acceptable for HR support.
      return res.status(404).json({ success: false, message: 'No employee account found with this email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    console.log(`🔑 Reset token generated for ${email}`);
    
    const sent = await sendPasswordResetEmail(email, user.name, resetToken);
    if (!sent) {
       return res.status(500).json({ success: false, message: 'Failed to send reset email. Contact IT.' });
    }

    res.json({ success: true, message: 'A secure password reset link has been sent to your email.' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Find user with valid token and not expired
    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'The reset link is invalid or has expired' });
    }

    // Set new password (model pre-save will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully. You can now login.' });
  } catch (err) { 
    res.status(500).json({ success: false, message: err.message }); 
  }
};
