const drive = require('../config/googleDrive');
const fs = require('fs');

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path to the file
 * @param {string} fileName - Name for the file on Drive
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{driveId: string, viewLink: string} | null>}
 */
exports.uploadToDrive = async (filePath, fileName, mimeType = 'application/pdf') => {
  if (!drive) {
    console.warn('⚠️ Google Drive not initialized. Please check GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON in .env');
    return null;
  }

  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log(`📤 Uploading to Drive: ${fileName} (${mimeType})`);
    console.log(`📂 Target Folder ID: ${folderId || 'ROOT'}`);
    
    const fileMetadata = {
      name: fileName,
      parents: folderId ? [folderId] : []
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink'
    });

    console.log(`✅ File created on Drive. ID: ${response.data.id}`);

    // Make file readable by anyone with the link
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        }
      });
    } catch (permErr) {
      console.warn('⚠️ Could not set public permissions on Drive file:', permErr.message);
    }

    return {
      driveId: response.data.id,
      viewLink: response.data.webViewLink
    };
  } catch (err) {
    console.error('❌ Google Drive upload failed:', err.message);
    throw err;
  }
};

/**
 * Download a file from Google Drive as a Buffer
 * @param {string} fileId - ID of the file on Drive
 * @returns {Promise<Buffer>}
 */
exports.downloadFromDrive = async (fileId) => {
  if (!drive) throw new Error('Drive service not initialized');
  
  try {
    const response = await drive.files.get(
      { fileId: fileId, alt: 'media' },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  } catch (err) {
    console.error(`❌ Failed to download file ${fileId} from Drive:`, err.message);
    throw err;
  }
};
