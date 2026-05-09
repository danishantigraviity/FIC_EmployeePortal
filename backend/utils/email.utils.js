require('dotenv').config();
const { google } = require('googleapis');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.SMTP_USER || process.env.EMAIL_USER || 'antigraviity.cro@gmail.com').trim();

// Gmail API via HTTPS (port 443) — works on Render, no SMTP port issues
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const createRawMessage = (to, subject, html) => {
  const str = [
    `Content-Type: text/html; charset="UTF-8"\n`,
    `MIME-Version: 1.0\n`,
    `Content-Transfer-Encoding: 7bit\n`,
    `to: ${to}\n`,
    `from: "Forge India HR" <${emailUser}>\n`,
    `subject: ${subject}\n\n`,
    `${html}`
  ].join('');
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const sendMail = async (to, subject, html) => {
  try {
    const raw = createRawMessage(to, subject, html);
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });
    console.log(`✅ Email sent to ${to}. ID: ${res.data.id}`);
    return true;
  } catch (err) {
    console.warn(`⚠️ Email failed for ${to}:`, err.message);
    return false;
  }
};

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#0D2B6B">Welcome to Forge India, ${name}!</h2>
      <p>You have been invited to complete your employee onboarding.</p>
      <a href="${url}" style="background:#1A4FA0;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;margin:16px 0">
        Complete Registration
      </a>
      <p style="color:#999;font-size:12px">Link expires in 48 hours.</p>
    </div>`;
  return sendMail(email, 'Complete Your Registration — Forge India', html);
};

exports.sendApprovalEmail = async (email, name) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#059669">Congratulations, ${name}!</h2>
      <p>Your profile has been reviewed and <strong>approved</strong> by HR.</p>
      <p>You can now access the employee portal and view your onboarding status.</p>
    </div>`;
  return sendMail(email, 'Profile Approved — Forge India', html);
};

exports.sendRejectionEmail = async (email, name, reason) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#DC2626">Profile Update — ${name}</h2>
      <p>Unfortunately, your profile submission was not approved at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please contact your HR representative for further guidance.</p>
    </div>`;
  return sendMail(email, 'Profile Update — Forge India', html);
};

exports.sendPdfReadyEmail = async (email, name) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#0D2B6B">Dossier Ready — ${name}</h2>
      <p>Your compiled employee document dossier has been generated and securely stored.</p>
      <p>Your HR team now has access to your complete verified employee file.</p>
    </div>`;
  return sendMail(email, 'Your Dossier is Ready — Forge India', html);
};

exports.sendDriveSyncEmail = async (email, name, driveLink) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#0D2B6B">Drive Sync Complete — ${name}</h2>
      <p>Your compiled dossier has been successfully synced to Google Drive.</p>
      ${driveLink ? `<a href="${driveLink}" style="color:#1A4FA0">View on Google Drive</a>` : ''}
    </div>`;
  return sendMail(email, 'Drive Sync Complete — Forge India', html);
};

exports.sendOTPEmail = async (email, otp) => {
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px">
      <h2 style="color:#0D2B6B">Your Verification Code</h2>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1A4FA0">${otp}</p>
      <p style="color:#999;font-size:12px">This code expires in 10 minutes.</p>
    </div>`;
  return sendMail(email, 'Verification Code — Forge India', html);
};

exports.sendResetEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/reset-password?token=${token}`;
  const html = `
    <div style="font-family:sans-serif;padding:20px;max-width:600px;border:1px solid #eee;border-radius:12px">
      <h2 style="color:#0D2B6B;margin-top:0">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password for the Forge India Employee Portal.</p>
      <div style="margin:24px 0">
        <a href="${url}" style="background:#F5C518;color:#0D2B6B;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">
          Reset Password
        </a>
      </div>
      <p style="color:#666;font-size:13px">If you did not request this, please ignore this email. This link will expire in 1 hour.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
      <p style="color:#999;font-size:11px">Forge India Private Limited • Employee Support</p>
    </div>`;
  return sendMail(email, 'Reset Your Password — Forge India', html);
};
