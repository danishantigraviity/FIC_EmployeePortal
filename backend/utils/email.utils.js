require('dotenv').config();
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || 'antigraviity.cro@gmail.com').trim();
const emailPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || '').trim();
const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);

// Initialize Gmail API client only if credentials exist
let gmail = null;
const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

const isGmailApiConfigured = 
  clientId && !clientId.includes('your_client_id') &&
  clientSecret && !clientSecret.includes('your_client_secret') &&
  refreshToken && !refreshToken.includes('your_refresh_token');

if (isGmailApiConfigured) {
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost'
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  gmail = google.gmail({ version: 'v1', auth: oauth2Client });
}

// Initialize Nodemailer SMTP transport only if credentials exist
let smtpTransporter = null;
const isSmtpConfigured = 
  emailUser && !emailUser.includes('your_email') &&
  emailPass && emailPass.length > 0;

if (isSmtpConfigured) {
  smtpTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

const createRawMessage = (to, subject, html) => {
  const messageParts = [
    `From: "Forge India" <${emailUser}>`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    html,
  ];
  const message = messageParts.join('\r\n');
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendMail = async (to, subject, html) => {
  // Method 1: Try Gmail API (HTTPS) if configured
  if (isGmailApiConfigured && gmail) {
    try {
      console.log(`📡 Attempting to send email via Gmail API to ${to}...`);
      const raw = createRawMessage(to, subject, html);
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw }
      });
      console.log(`✅ Email sent via Gmail API to ${to}. ID: ${res.data.id}`);
      return true;
    } catch (err) {
      console.warn(`⚠️ Gmail API failed for ${to}:`, err.message);
      // Fall through to SMTP if SMTP is configured
    }
  }

  // Method 2: Fallback to SMTP (Nodemailer) if configured
  if (isSmtpConfigured && smtpTransporter) {
    try {
      console.log(`📡 Attempting to send email via SMTP fallback to ${to}...`);
      const info = await smtpTransporter.sendMail({
        from: `"Forge India" <${emailUser}>`,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent via SMTP to ${to}. MessageID: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error(`❌ SMTP fallback also failed for ${to}:`, err.message);
      return false;
    }
  }

  console.error(`❌ No email sending method configured or all methods failed. Provide valid Gmail API or SMTP credentials.`);
  return false;
};

const EMAIL_LAYOUT = (content) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Forge India</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; margin-top: 40px; overflow: hidden; }
        .content { padding: 48px 32px; text-align: center; }
        .logo { width: 120px; height: auto; margin-bottom: 32px; }
        .h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 16px; line-height: 1.3; }
        .p { font-size: 16px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; padding: 14px 32px; background-color: #1A4FA0; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; margin: 8px 0; transition: background-color 0.2s; }
        .footer { padding: 24px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
        .highlight { color: #1A4FA0; font-weight: 600; }
        @media screen and (max-width: 600px) { .content { padding: 32px 20px; } .main { margin-top: 20px; border-radius: 0; } }
      </style>
    </head>
    <body>
      <center class="wrapper">
        <table class="main" width="100%">
          <tr>
            <td class="content">
              <img src="${getFrontendUrl()}/logo.png" alt="Forge India" class="logo">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              &copy; ${new Date().getFullYear()} Forge India Private Limited. All rights reserved.<br>
              Employee Onboarding Portal &bull; HR Support
            </td>
          </tr>
        </table>
      </center>
    </body>
  </html>
`;

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  const html = EMAIL_LAYOUT(`
    <h1 class="h1">Complete Your Onboarding</h1>
    <p class="p">Hello <span class="highlight">${name}</span>,<br>You've been invited to join the Forge India team. Please complete your registration to begin the onboarding process.</p>
    <a href="${url}" class="btn">Get Started</a>
    <p class="p" style="font-size: 13px; margin-top: 32px; color: #94a3b8;">This link will expire in 48 hours for security reasons.</p>
  `);
  return sendMail(email, 'Complete Your Registration - Forge India', html);
};

exports.sendApprovalEmail = async (email, name) => {
  const html = EMAIL_LAYOUT(`
    <h1 class="h1" style="color: #059669;">Welcome Aboard!</h1>
    <p class="p">Congratulations <span class="highlight">${name}</span>,<br>Your profile has been reviewed and <b style="color: #059669;">officially approved</b> by the HR department.</p>
    <p class="p">You can now access your employee dashboard to view next steps.</p>
    <a href="${getFrontendUrl()}" class="btn">Access Portal</a>
  `);
  return sendMail(email, 'Profile Approved - Forge India', html);
};

exports.sendRejectionEmail = async (email, name, reason) => {
  const html = EMAIL_LAYOUT(`
    <h1 class="h1" style="color: #e11d48;">Profile Update</h1>
    <p class="p">Hello ${name},<br>Your profile submission requires some modifications before it can be approved.</p>
    ${reason ? `<div style="background: #fff1f2; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: left;"><p class="p" style="color: #9f1239; margin-bottom: 0;"><b>Feedback:</b> ${reason}</p></div>` : ''}
    <p class="p">Please log in to the portal to address the items mentioned above.</p>
    <a href="${getFrontendUrl()}" class="btn" style="background-color: #e11d48;">Update Profile</a>
  `);
  return sendMail(email, 'Action Required: Profile Update - Forge India', html);
};

exports.sendOTPEmail = async (email, otp) => {
  const html = EMAIL_LAYOUT(`
    <h1 class="h1">Verify Your Identity</h1>
    <p class="p">Please use the verification code below to securely access your account.</p>
    <div style="background: #f1f5f9; padding: 24px; border-radius: 12px; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #1A4FA0; font-family: monospace;">${otp}</span>
    </div>
    <p class="p" style="font-size: 13px; color: #94a3b8;">For your security, this code expires in 10 minutes.</p>
  `);
  return sendMail(email, 'Verification Code - Forge India', html);
};

exports.sendPasswordResetEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/reset-password?token=${token}`;
  const html = EMAIL_LAYOUT(`
    <h1 class="h1">Password Reset</h1>
    <p class="p">Hello ${name},<br>We received a request to reset your password. Click the button below to choose a new one.</p>
    <a href="${url}" class="btn" style="background-color: #F5C518; color: #0D2B6B !important;">Reset Password</a>
    <p class="p" style="font-size: 13px; margin-top: 32px; color: #94a3b8;">If you did not request this reset, you can safely ignore this email.</p>
  `);
  return sendMail(email, 'Reset Your Password - Forge India', html);
};

exports.sendPdfReadyEmail = async (email, name) => {
  const html = EMAIL_LAYOUT(`
    <h1 class="h1">Documents Compiled</h1>
    <p class="p">Hello ${name},<br>Your onboarding documents have been successfully compiled into a single PDF.</p>
    <p class="p">The HR team can now review your complete application.</p>
  `);
  return sendMail(email, 'Documents Ready - Forge India', html);
};

exports.sendDriveSyncEmail = async (email, name, link) => {
  const html = EMAIL_LAYOUT(`
    <h1 class="h1">Backup Created</h1>
    <p class="p">Hello ${name},<br>A secure backup of your compiled documents has been synced to Google Drive.</p>
    <a href="${link}" class="btn">View on Drive</a>
  `);
  return sendMail(email, 'Backup Synced - Forge India', html);
};
