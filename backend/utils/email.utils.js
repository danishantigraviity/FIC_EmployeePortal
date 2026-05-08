require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Robust Frontend URL detection with production fallback
const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, ''); // Remove trailing slash
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();

if (!emailUser || !emailPass) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASS is missing in .env. Emails may not send.');
}

const transporterConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
  tls: {
    rejectUnauthorized: false
  }
};

const transporter = nodemailer.createTransport(transporterConfig);

// Verify connection on startup
console.log(`🔌 Verifying email transporter (${transporterConfig.host}:${transporterConfig.port})...`);
transporter.verify((error) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
  } else {
    console.log(`✅ Email transporter ready (${emailUser})`);
  }
});

// Professional HTML Template Wrapper
const getHtmlTemplate = (title, content, buttonLabel = '', buttonUrl = '') => `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e1e4e8; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1A4FA0 0%, #163d7a 100%); background-color: #1A4FA0; padding: 35px 20px; text-align: center; border-bottom: 4px solid #F5C518;">
      <img src="cid:companyLogo" alt="Forge India Logo" role="presentation" border="0" style="width: 220px; height: auto; display: block; margin: 0 auto; max-width: 85%;" />
      <div style="margin-top: 15px; color: #ffffff; font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; font-weight: 600; opacity: 0.9;">
        Employee Onboarding Portal
      </div>
    </div>
    <div style="padding: 45px 35px; line-height: 1.6; color: #24292e;">
      <h2 style="color: #1A4FA0; font-size: 24px; margin-top: 0; font-weight: 700; letter-spacing: -0.5px;">${title}</h2>
      <div style="font-size: 16px; color: #444d56;">
        ${content}
      </div>
      ${buttonLabel && buttonUrl ? `
        <div style="text-align: center; margin-top: 45px;">
          <a href="${buttonUrl}" style="display: inline-block; padding: 18px 36px; background-color: #1A4FA0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px;">${buttonLabel}</a>
        </div>
      ` : ''}
    </div>
    <div style="background-color: #f6f8fa; padding: 30px; text-align: center; font-size: 12px; color: #586069; border-top: 1px solid #e1e4e8;">
      <p style="margin: 0; font-weight: 600;">Forge India Human Resources</p>
      <p style="margin: 4px 0 0 0;">This is an automated security notification.</p>
      <div style="margin-top: 18px; font-size: 11px; opacity: 0.7;">
        © 2026 Forge India Connect • Bangalore, India
      </div>
    </div>
  </div>
`;

// Helper to get attachments safely
const getAttachments = () => {
  const logoPath = path.join(__dirname, '../assets/logo.png');
  try {
    if (fs.existsSync(logoPath)) {
      return [{
        filename: 'logo.png',
        path: logoPath,
        cid: 'companyLogo'
      }];
    }
  } catch (err) {
    console.warn('⚠️ Could not find logo attachment');
  }
  return [];
};

// --- EMAIL FUNCTIONS ---

exports.sendRegistrationEmail = async (email, name, token, retryCount = 0) => {
  console.log(`📧 Attempting to send registration email to: ${email} (Attempt ${retryCount + 1})`);
  const frontendUrl = getFrontendUrl();
  const url = `${frontendUrl}/register?token=${token}`;
  const html = getHtmlTemplate(
    `Welcome to the Team, ${name}!`,
    `<p>You have been invited to join the Forge India Employee Portal. To begin your onboarding journey, please click the button below to complete your registration and set up your account profile.</p>
     <p style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C518; font-size: 14px;"><strong>Important:</strong> This registration link will expire in 48 hours for security reasons.</p>`,
    'Complete Registration',
    url
  );

  try {
    const mailOptions = {
      from: `"Forge India HR" <${emailUser}>`,
      to: email,
      subject: 'Welcome to Forge India — Complete Your Registration',
      html,
      attachments: getAttachments()
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Registration email dispatched: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed for ${email}:`, err.message);
    if (retryCount < 2) {
      console.log(`🔄 Retrying in 3 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      return exports.sendRegistrationEmail(email, name, token, retryCount + 1);
    }
    throw err;
  }
};

exports.sendApprovalEmail = async (email, name) => {
  const html = getHtmlTemplate(
    'Profile Approved!',
    `<p>Dear ${name},</p>
     <p>Your onboarding profile has been successfully verified and <strong>approved</strong>.</p>`,
    'Go to Dashboard',
    `${getFrontendUrl()}/dashboard`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Your Profile Has Been Approved — Forge India',
    html,
    attachments: getAttachments()
  });
};

exports.sendRejectionEmail = async (email, name, reason) => {
  const html = getHtmlTemplate(
    'Action Required: Profile Update',
    `<p>Dear ${name},</p>
     <p>Your profile requires updates before approval:</p>
     <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545;">
       <strong>Reason:</strong><br>${reason}
     </div>`,
    'Update Profile',
    `${getFrontendUrl()}/profile`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Profile Verification Update Required — Forge India',
    html,
    attachments: getAttachments()
  });
};

exports.sendPdfReadyEmail = async (email, name) => {
  const html = getHtmlTemplate(
    'Documents Ready',
    `<p>Dear ${name},</p>
     <p>Your compiled onboarding document package is now ready for download.</p>`,
    'Download PDF',
    `${getFrontendUrl()}/dashboard`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Onboarding Documents Ready — Forge India',
    html,
    attachments: getAttachments()
  });
};

exports.sendDriveSyncEmail = async (email, name, driveLink) => {
  const html = getHtmlTemplate(
    'Cloud Backup Completed',
    `<p>Dear ${name},</p>
     <p>Your documents have been successfully synced to Google Drive.</p>`,
    'View in Drive',
    driveLink
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Document Backup Successful — Forge India',
    html,
    attachments: getAttachments()
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  const url = `${getFrontendUrl()}/reset-password?token=${token}`;
  const html = getHtmlTemplate(
    'Password Reset',
    `<p>Click below to reset your password. Valid for 1 hour.</p>`,
    'Reset Password',
    url
  );

  return transporter.sendMail({
    from: `"Forge India Security" <${emailUser}>`,
    to: email,
    subject: 'Password Reset Request — Forge India',
    html,
    attachments: getAttachments()
  });
};
