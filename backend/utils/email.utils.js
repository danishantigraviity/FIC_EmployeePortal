require('dotenv').config();
const nodemailer = require('nodemailer');

// Use EMAIL_USER/PASS as primary, fallback to SMTP_USER/PASS
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

const transporterConfig = {
  service: 'gmail',
  pool: true,
  auth: {
    user: emailUser,
    pass: emailPass
  }
};

const transporter = nodemailer.createTransport(transporterConfig);

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error.message);
  } else {
    console.log('✅ Email transporter ready to send messages');
  }
});

// Professional HTML Template Wrapper
const getHtmlTemplate = (title, content, buttonLabel = '', buttonUrl = '') => `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e1e4e8; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #1A4FA0 0%, #163d7a 100%); background-color: #1A4FA0; padding: 35px 20px; text-align: center; border-bottom: 4px solid #F5C518;">
      <img src="cid:companyLogo" alt="Forge India Logo" role="presentation" border="0" style="width: 220px; height: auto; display: block; margin: 0 auto; max-width: 85%; pointer-events: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;" />
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
          <a href="${buttonUrl}" style="display: inline-block; padding: 18px 36px; background-color: #1A4FA0; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; transition: all 0.2s ease;">${buttonLabel}</a>
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

// Shared attachments configuration
const attachments = [{
  filename: 'logo.png',
  path: 'c:/Users/PC/Desktop/FIC-main/frontend/src/assets/FIC.png',
  cid: 'companyLogo'
}];

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${process.env.CLIENT_URL}/register?token=${token}`;
  const html = getHtmlTemplate(
    `Welcome to the Team, ${name}!`,
    `<p>You have been invited to join the Forge India Employee Portal. To begin your onboarding journey, please click the button below to complete your registration and set up your account profile.</p>
     <p style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #F5C518; font-size: 14px;"><strong>Important:</strong> This registration link will expire in 48 hours for security reasons.</p>`,
    'Complete Registration',
    url
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Welcome to Forge India — Complete Your Registration',
    html,
    attachments
  });
};

exports.sendApprovalEmail = async (email, name) => {
  const html = getHtmlTemplate(
    'Profile Approved!',
    `<p>Dear ${name},</p>
     <p>We are pleased to inform you that your onboarding profile has been successfully verified and <strong>approved</strong> by the HR department.</p>
     <p>You can now access your full dashboard and view your generated appointment documents.</p>`,
    'Go to Dashboard',
    `${process.env.CLIENT_URL}/dashboard`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Your Profile Has Been Approved — Forge India',
    html,
    attachments
  });
};

exports.sendRejectionEmail = async (email, name, reason) => {
  const html = getHtmlTemplate(
    'Action Required: Profile Update',
    `<p>Dear ${name},</p>
     <p>Your onboarding profile has been reviewed and requires some updates before it can be approved.</p>
     <div style="background: #f8d7da; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; color: #721c24;">
       <strong>Reason for rejection:</strong><br>${reason}
     </div>
     <p style="margin-top: 20px;">Please log in to your portal and update the requested information so we can proceed with your onboarding.</p>`,
    'Update Profile',
    `${process.env.CLIENT_URL}/profile`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Profile Verification Update Required — Forge India',
    html,
    attachments
  });
};

exports.sendOTPEmail = async (email, otp) => {
  const html = getHtmlTemplate(
    'Verification Code',
    `<p>Use the following One-Time Password (OTP) to complete your verification process. This code is valid for 10 minutes.</p>
     <div style="text-align: center; margin: 30px 0;">
       <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1A4FA0; background: #f0f4f8; padding: 10px 30px; border-radius: 12px; border: 1px dashed #1A4FA0;">${otp}</span>
     </div>
     <p>If you did not request this code, please secure your account immediately.</p>`
  );

  return transporter.sendMail({
    from: `"Forge India Security" <${emailUser}>`,
    to: email,
    subject: `Your Verification Code: ${otp}`,
    html,
    attachments
  });
};

exports.sendPdfReadyEmail = async (email, name) => {
  const html = getHtmlTemplate(
    'Documents Ready for Download',
    `<p>Dear ${name},</p>
     <p>Your compiled onboarding document package has been successfully generated and is now ready for your review.</p>
     <p>The package includes your signed Appointment Letter, NDA, and other essential onboarding forms merged into a single secure PDF.</p>`,
    'Download PDF',
    `${process.env.CLIENT_URL}/dashboard`
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Onboarding Documents Ready — Forge India',
    html,
    attachments
  });
};

exports.sendDriveSyncEmail = async (email, name, driveLink) => {
  const html = getHtmlTemplate(
    'Secure Cloud Backup Completed',
    `<p>Dear ${name},</p>
     <p>Your onboarding documents have been successfully synchronized to our secure Google Drive storage.</p>
     <p>You can access a permanent cloud copy of your documents using the button below.</p>`,
    'View in Google Drive',
    driveLink
  );

  return transporter.sendMail({
    from: `"Forge India HR" <${emailUser}>`,
    to: email,
    subject: 'Document Backup Successful — Forge India',
    html,
    attachments
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const html = getHtmlTemplate(
    'Password Reset Request',
    `<p>We received a request to reset your password for the Forge India portal.</p>
     <p>Click the button below to choose a new password. This link will expire in 1 hour.</p>`,
    'Reset Password',
    url
  );

  return transporter.sendMail({
    from: `"Forge India Security" <${emailUser}>`,
    to: email,
    subject: 'Password Reset Request — Forge India',
    html,
    attachments
  });
};
