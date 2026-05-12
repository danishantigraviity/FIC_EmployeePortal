require('dotenv').config();
const emailService = require('./utils/email.utils');

const testEmail = async () => {
  const recipient = 'antigraviity.cro@gmail.com'; // Testing to yourself
  console.log(`🚀 Sending test email to ${recipient}...`);
  
  try {
    // Testing the most complex template (Sync)
    const info = await emailService.sendOTPEmail(
      recipient, 
      '123456'
    );
    console.log('✅ Success! Message ID:', info.messageId);
    console.log('📬 Check your inbox for the premium template!');
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    if (err.response) {
      console.error('Error Details:', err.response);
    }
  } finally {
    process.exit();
  }
};

testEmail();
