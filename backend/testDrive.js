require('dotenv').config();
const drive = require('./config/googleDrive');

const testDrive = async () => {
  if (!drive) {
    console.error('❌ Drive not initialized. Check your credentials and .env');
    return;
  }

  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log(`🔍 Checking Folder ID: ${folderId}`);

    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, permissions'
    });

    console.log(`✅ Folder found: ${res.data.name} (${res.data.id})`);
    
    // Check if we can list files in it
    const list = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name)'
    });

    console.log(`📁 Files in folder: ${list.data.files.length}`);
    list.data.files.forEach(f => console.log(` - ${f.name} (${f.id})`));

  } catch (err) {
    console.error('❌ Drive Test Failed:', err.message);
    if (err.message.includes('404')) {
      console.error('👉 Suggestion: The Folder ID might be wrong or the service account lacks access.');
    }
  } finally {
    process.exit();
  }
};

testDrive();
