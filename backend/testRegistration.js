require('dotenv').config();
const emailService = require('./utils/email.utils');

const testRegistration = async () => {
  const recipient = 'antigraviity.cro@gmail.com';
  const token = 'test-token-123';
  console.log(`🚀 Sending test registration email to ${recipient}...`);
  
  try {
    const info = await emailService.sendRegistrationEmail(recipient, 'Test Dhanush', token);
    console.log('✅ Success! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ Failed:', err.message);
  } finally {
    process.exit();
  }
};

testRegistration();
