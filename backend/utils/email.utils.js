require('dotenv').config();
const nodemailer = require('nodemailer');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || 'antigraviity.cro@gmail.com').trim();

// CREATE TRANSPORTER (Direct OAuth2 - Nodemailer handles the refresh automatically)
console.log('🔌 Configuring Gmail API (OAuth2)...');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: emailUser,
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
  }
});

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  
  console.log(`✉️ Attempting to send invite to: ${email}...`);
  
  try {
    const info = await transporter.sendMail({
      from: `"Forge India HR" <${emailUser}>`,
      to: email,
      subject: 'Complete Your Registration — Forge India',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1A4FA0;">Welcome ${name}!</h2>
          <p>Please click the button below to complete your registration:</p>
          <a href="${url}" style="background-color: #1A4FA0; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
          <p style="margin-top: 20px; font-size: 12px; color: #888;">This link expires in 48 hours.</p>
        </div>
      `
    });
    console.log(`✅ SUCCESS! Email delivered: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ GMAIL API ERROR for ${email}:`, err.message);
    
    // Fallback to SMTP if OAuth2 fails for some reason
    if (err.message.includes('auth') || err.message.includes('token')) {
      console.log('🔄 Attempting Emergency SMTP Fallback (Port 587)...');
      const fallbackTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: process.env.EMAIL_PASS || process.env.SMTP_PASS },
        tls: { rejectUnauthorized: false }
      });
      return fallbackTransporter.sendMail({
        from: `"Forge India" <${emailUser}>`,
        to: email,
        subject: 'Complete Your Registration — Forge India (Fallback)',
        html: `<p>Registration Link: ${url}</p>`
      });
    }
    throw err;
  }
};

// Other simplified exports
exports.sendApprovalEmail = async (email, name) => {
  return transporter.sendMail({ from: `"Forge India" <${emailUser}>`, to: email, subject: 'Profile Approved', html: `<p>Approved, ${name}!</p>` });
};
exports.sendOTPEmail = async (email, otp) => {
  return transporter.sendMail({ from: `"Forge India Security" <${emailUser}>`, to: email, subject: 'OTP Code', html: `<p>Code: ${otp}</p>` });
};
