require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || 'antigraviity.cro@gmail.com').trim();

// OAUTH2 CONFIG (using existing Drive credentials)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

// CREATE TRANSPORTER (Using OAuth2 - This works on Port 443 which is NEVER blocked)
const createTransporter = async () => {
  try {
    console.log('🔌 Initializing Gmail API via OAuth2 (Port 443)...');
    const accessToken = await oauth2Client.getAccessToken();
    
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: emailUser,
        clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
        accessToken: accessToken.token
      }
    });
  } catch (err) {
    console.error('❌ OAuth2 initialization failed. Falling back to SMTP Port 587...', err.message);
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
      },
      tls: { rejectUnauthorized: false }
    });
  }
};

let transporterPromise = createTransporter();

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  const transporter = await transporterPromise;
  
  try {
    const info = await transporter.sendMail({
      from: `"Forge India HR" <${emailUser}>`,
      to: email,
      subject: 'Complete Your Registration — Forge India',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #1A4FA0;">Welcome to Forge India, ${name}!</h2>
          <p>Please click the button below to set up your account and complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${url}" style="background-color: #1A4FA0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Complete Registration</a>
          </div>
          <p style="font-size: 12px; color: #666;">This link will expire in 48 hours.</p>
        </div>
      `
    });
    console.log(`✅ Email sent via Gmail API: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email delivery failed: ${err.message}`);
    // If it was an auth error, try to refresh transporter for next time
    if (err.message.includes('auth') || err.message.includes('token')) {
      transporterPromise = createTransporter();
    }
    throw err;
  }
};

// Other simplified exports
exports.sendApprovalEmail = async (email, name) => {
  const transporter = await transporterPromise;
  return transporter.sendMail({ from: `"Forge India" <${emailUser}>`, to: email, subject: 'Profile Approved', html: `<p>Hi ${name}, your profile is approved!</p>` });
};

exports.sendOTPEmail = async (email, otp) => {
  const transporter = await transporterPromise;
  return transporter.sendMail({ from: `"Forge India Security" <${emailUser}>`, to: email, subject: 'Verification Code', html: `<p>Your code is: <b>${otp}</b></p>` });
};
