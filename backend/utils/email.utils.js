require('dotenv').config();
const nodemailer = require('nodemailer');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();

// CREATE TRANSPORTER FUNCTION (so we can recreate it on failure)
const createTransporter = (port) => {
  console.log(`🔌 Attempting to create transporter on Port ${port}...`);
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    auth: { user: emailUser, pass: emailPass },
    connectionTimeout: 8000, // 8 seconds only
    greetingTimeout: 8000,
    socketTimeout: 15000,
    tls: { rejectUnauthorized: false }
  });
};

let transporter = createTransporter(465); // Start with 465

exports.sendRegistrationEmail = async (email, name, token, retryCount = 0) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  
  // Try sending. If it fails, switch port and try again ONCE.
  try {
    const info = await transporter.sendMail({
      from: `"Forge India HR" <${emailUser}>`,
      to: email,
      subject: 'Complete Your Registration — Forge India',
      html: `<h1>Welcome ${name}</h1><p>Click <a href="${url}">here</a> to register.</p>`
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email attempt ${retryCount + 1} failed: ${err.message}`);
    
    if (retryCount === 0) {
      console.log('🔄 SWITCHING TO PORT 587...');
      transporter = createTransporter(587);
      return exports.sendRegistrationEmail(email, name, token, 1);
    }
    throw err;
  }
};

// Other exports (simplified to use the same transporter)
exports.sendApprovalEmail = async (email, name) => {
  return transporter.sendMail({ from: `"Forge India" <${emailUser}>`, to: email, subject: 'Approved', html: `<p>Approved, ${name}!</p>` });
};
exports.sendRejectionEmail = async (email, name, reason) => {
  return transporter.sendMail({ from: `"Forge India" <${emailUser}>`, to: email, subject: 'Update Needed', html: `<p>Reason: ${reason}</p>` });
};
exports.sendOTPEmail = async (email, otp) => {
  return transporter.sendMail({ from: `"Forge India Security" <${emailUser}>`, to: email, subject: 'OTP', html: `<p>Code: ${otp}</p>` });
};
exports.sendPasswordResetEmail = async (email, token) => {
  const url = `${getFrontendUrl()}/reset-password?token=${token}`;
  return transporter.sendMail({ from: `"Forge India" <${emailUser}>`, to: email, subject: 'Reset Password', html: `<p><a href="${url}">Reset</a></p>` });
};
