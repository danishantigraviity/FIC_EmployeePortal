const jwt = require('jsonwebtoken');

exports.generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' }); // 1 day for dev convenience

exports.generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });

exports.sendTokens = (user, statusCode, res) => {
  const accessToken = exports.generateAccessToken(user._id, user.role);
  const refreshToken = exports.generateRefreshToken(user._id);

  // Set cookies (for production/same-origin)
  res.cookie('accessToken', accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken, // also return in body for dev proxy usage
    user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, profileCompletion: user.profileCompletion, completedSteps: user.completedSteps }
  });
};
