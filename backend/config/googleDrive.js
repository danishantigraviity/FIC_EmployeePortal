const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let drive;

try {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:3000'
  );

  if (process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
    });
    drive = google.drive({ version: 'v3', auth: oauth2Client });
    console.log('✅ Google Drive initialized via OAuth2');
  } else {
    let keyPath = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
    
    if (keyPath) {
      if (keyPath.startsWith('./')) {
        keyPath = path.join(__dirname, '..', keyPath);
      }

      if (fs.existsSync(keyPath)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: keyPath,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        drive = google.drive({ version: 'v3', auth });
        console.log('✅ Google Drive initialized via Service Account');
      } else {
        console.warn(`⚠️ Google Drive key file not found at: ${keyPath}`);
      }
    } else {
      console.warn('⚠️ No Google Drive credentials found (OAuth2 or Service Account)');
    }
  }
} catch (err) {
  console.error('Failed to initialize Google Drive:', err.message);
}

module.exports = drive;
