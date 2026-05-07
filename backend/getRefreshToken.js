const { google } = require('googleapis');
const readline = require('readline');

// Using credentials from environment variables
const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost'; // Matches your Google Cloud settings

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Forces a refresh token
});

console.log('\n🚀 AUTHORIZATION REQUIRED 🚀');
console.log('1. Open this link in your browser:\n');
console.log(authUrl);
console.log('\n2. Log in and click "Allow".');
console.log('3. You will be redirected to an error page (localhost).');
console.log('4. Look at the URL bar and copy the text after "code="');
console.log('   Example: if URL is http://localhost/?code=4/0Af... copy the 4/0Af... part.');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('');
rl.question('Paste the code here: ', (code) => {
  rl.close();
  // If the user pastes the whole URL, extract the code
  const finalCode = code.includes('code=') ? new URL(code).searchParams.get('code') : code;

  oauth2Client.getToken(finalCode, (err, token) => {
    if (err) {
      console.error('❌ Error retrieving access token:', err.message);
      return;
    }
    console.log('\n✅ SUCCESS! Here is your Refresh Token:\n');
    console.log(token.refresh_token);
    console.log('\nCopy this token and paste it into your .env as GOOGLE_DRIVE_REFRESH_TOKEN');
  });
});
