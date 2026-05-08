require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();

// Try 465 first, fallback to 587 if needed
const transporterConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  pool: true,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  timeout: 30000, // 30 seconds
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  debug: true, // Enable debug
  logger: true, // Enable logging
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  }
};

let transporter = nodemailer.createTransport(transporterConfig);

console.log(`🔌 Initializing email transporter (${transporterConfig.host}:${transporterConfig.port})...`);
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter (465) failed:', error.message);
    console.log('🔄 Attempting fallback to Port 587...');
    
    transporter = nodemailer.createTransport({
      ...transporterConfig,
      port: 587,
      secure: false,
      requireTLS: true
    });
    
    transporter.verify((err2) => {
      if (err2) {
        console.error('❌ Email transporter (587) also failed:', err2.message);
      } else {
        console.log('✅ Email transporter ready via Port 587');
      }
    });
  } else {
    console.log('✅ Email transporter ready via Port 465');
  }
});

const getHtmlTemplate = (title, content, buttonLabel = '', buttonUrl = '') => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e1e4e8; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #1A4FA0; padding: 30px; text-align: center; border-bottom: 4px solid #F5C518;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Forge India</h1>
    </div>
    <div style="padding: 40px 30px; line-height: 1.6; color: #24292e;">
      <h2 style="color: #1A4FA0; font-size: 20px;">${title}</h2>
      <div>${content}</div>
      ${buttonLabel && buttonUrl ? `<div style="text-align: center; margin-top: 30px;"><a href="${buttonUrl}" style="display: inline-block; padding: 14px 28px; background-color: #1A4FA0; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">${buttonLabel}</a></div>` : ''}
    </div>
    <div style="background-color: #f6f8fa; padding: 20px; text-align: center; font-size: 12px; color: #586069;">
      <p>© 2026 Forge India Connect</p>
    </div>
  </div>
`;

exports.sendRegistrationEmail = async (email, name, token, retryCount = 0) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  const html = getHtmlTemplate(
    `Welcome, ${name}!`,
    `<p>Click below to complete your registration. Link expires in 48h.</p>`,
    'Complete Registration',
    url
  );

  try {
    const info = await transporter.sendMail({
      from: `"Forge India HR" <${emailUser}>`,
      to: email,
      subject: 'Complete Your Registration — Forge India',
      html
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed (Attempt ${retryCount + 1}):`, err.message);
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 5000));
      return exports.sendRegistrationEmail(email, name, token, retryCount + 1);
    }
    throw err;
  }
};

// Simplified versions for other emails
exports.sendApprovalEmail = async (email, name) => {
  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Profile Approved — Forge India',
    html: getHtmlTemplate('Approved!', `<p>Hi ${name}, your profile is approved.</p>`, 'Dashboard', `${getFrontendUrl()}/dashboard`)
  });
};

exports.sendRejectionEmail = async (email, name, reason) => {
  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Update Required — Forge India',
    html: getHtmlTemplate('Update Needed', `<p>Reason: ${reason}</p>`, 'Update Profile', `${getFrontendUrl()}/profile`)
  });
};

exports.sendOTPEmail = async (email, otp) => {
  return transporter.sendMail({
    from: `"Forge India Security" <${emailUser}>`,
    to: email,
    subject: `OTP: ${otp}`,
    html: getHtmlTemplate('Verification Code', `<p>Your code is: <b>${otp}</b></p>`)
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  return transporter.sendMail({
    from: `"Forge India Security" <${emailUser}>`,
    to: email,
    subject: 'Password Reset',
    html: getHtmlTemplate('Reset Password', `<p>Click below.</p>`, 'Reset', `${getFrontendUrl()}/reset-password?token=${token}`)
  });
};
