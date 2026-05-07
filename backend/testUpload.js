require('dotenv').config();
const driveService = require('./services/drive.service');
const fs = require('fs');
const path = require('path');

const testUpload = async () => {
  const testFilePath = path.join(__dirname, 'test-file.txt');
  fs.writeFileSync(testFilePath, 'This is a test file for Google Drive connectivity.');

  try {
    console.log('🚀 Starting test upload...');
    const result = await driveService.uploadToDrive(testFilePath, 'Test_Upload.txt', 'text/plain');
    
    if (result) {
      console.log('✅ Upload Success!');
      console.log(`📎 Drive ID: ${result.driveId}`);
      console.log(`🔗 View Link: ${result.viewLink}`);
    } else {
      console.log('❌ Upload failed (no result returned)');
    }
  } catch (err) {
    console.error('❌ Upload failed with error:', err.message);
    if (err.response) {
      console.error('Error Details:', JSON.stringify(err.response.data, null, 2));
    }
  } finally {
    if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    process.exit();
  }
};

testUpload();
