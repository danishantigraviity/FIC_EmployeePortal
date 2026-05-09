require('dotenv').config();
const { google } = require('googleapis');

const getFrontendUrl = () => {
  const url = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://fic-employee-portal.vercel.app';
  return url.replace(/\/$/, '');
};

const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || 'antigraviity.cro@gmail.com').trim();

// INITIALIZE OFFICIAL GMAIL CLIENT (Uses HTTPS Port 443 - Cannot be blocked)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Helper to encode email to Base64 (Required by Gmail API)
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

exports.sendRegistrationEmail = async (email, name, token) => {
  const url = `${getFrontendUrl()}/register?token=${token}`;
  
  console.log(`🌐 [GMAIL API] Sending HTTPS invite to: ${email}...`);
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Welcome to Forge India, ${name}!</h2>
      <p>Click below to complete your registration:</p>
      <a href="${url}" style="background-color: #1A4FA0; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Complete Registration</a>
    </div>
  `;

  try {
    const rawContent = createRawMessage(email, 'Complete Your Registration — Forge India', html);
    
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawContent }
    });

    console.log(`✅ SUCCESS! Email sent via Gmail HTTPS API. Message ID: ${res.data.id}`);
    return true;
  } catch (err) {
    console.error(`❌ GMAIL HTTPS API ERROR for ${email}:`, err.message);
    throw err;
  }
};

// Simplified versions for other emails
exports.sendApprovalEmail = async (email, name) => {
  const html = `<p>Hi ${name}, your profile is approved!</p>`;
  const raw = createRawMessage(email, 'Profile Approved — Forge India', html);
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
};

exports.sendOTPEmail = async (email, otp) => {
  const html = `<p>Your code: <b>${otp}</b></p>`;
  const raw = createRawMessage(email, 'Verification Code', html);
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
};

exports.sendRejectionEmail = async (email, name, reason) => {
  const html = `<div style="font-family:sans-serif;padding:20px"><h2>Hi ${name},</h2><p>Unfortunately your profile has been rejected.</p>${reason ? `<p><b>Reason:</b> ${reason}</p>` : ''}<p>Please contact HR for more details.</p></div>`;
  const raw = createRawMessage(email, 'Profile Update — Forge India', html);
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw } }).catch(e => console.warn('sendRejectionEmail failed:', e.message));
};

exports.sendPdfReadyEmail = async (email, name) => {
  const html = `<div style="font-family:sans-serif;padding:20px"><h2>Hi ${name},</h2><p>Your compiled document dossier is ready and has been securely stored.</p><p>Your HR team can now access your complete employee file.</p></div>`;
  const raw = createRawMessage(email, 'Your Dossier is Ready — Forge India', html);
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw } }).catch(e => console.warn('sendPdfReadyEmail failed:', e.message));
};

exports.sendDriveSyncEmail = async (email, name, driveLink) => {
  const html = `<div style="font-family:sans-serif;padding:20px"><h2>Hi ${name},</h2><p>Your documents have been synced to Google Drive.</p>${driveLink ? `<p><a href="${driveLink}">View your dossier</a></p>` : ''}</div>`;
  const raw = createRawMessage(email, 'Drive Sync Complete — Forge India', html);
  return gmail.users.messages.send({ userId: 'me', requestBody: { raw } }).catch(e => console.warn('sendDriveSyncEmail failed:', e.message));
};
