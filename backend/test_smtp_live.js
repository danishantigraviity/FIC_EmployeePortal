const nodemailer = require('nodemailer');

const emailUser = 'antigraviity.cro@gmail.com';
const emailPass = 'eyaozulvrolaivag';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: emailUser,
    pass: emailPass
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log(`Testing SMTP for ${emailUser}...`);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Verification failed:', error.message);
  } else {
    console.log('✅ Server is ready to take our messages');
    
    const mailOptions = {
      from: `"Test" <${emailUser}>`,
      to: emailUser,
      subject: 'SMTP Test',
      text: 'This is a test email to verify SMTP configuration.'
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('❌ Send failed:', err.message);
      } else {
        console.log('✅ Email sent:', info.messageId);
      }
    });
  }
});
