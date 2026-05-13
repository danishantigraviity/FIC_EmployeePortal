const drive = require('../config/googleDrive');
const fs = require('fs');

/**
 * Create a folder or get its ID if it already exists
 * @param {string} folderName - Name of the folder to find/create
 * @param {string} parentId - Parent folder ID (defaults to root)
 * @returns {Promise<string>}
 */
exports.getOrCreateFolder = async (folderName, parentId = process.env.GOOGLE_DRIVE_FOLDER_ID) => {
  if (!drive) return null;

  try {
    const q = `name='${folderName.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
    const list = await drive.files.list({ q, fields: 'files(id, name)', spaces: 'drive' });

    if (list.data.files && list.data.files.length > 0) {
      return list.data.files[0].id;
    }

    // Create new folder
    const response = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id',
      supportsAllDrives: true
    });

    // Make folder public (reader)
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true
      });
    } catch (e) { console.warn('⚠️ Folder permissions failed:', e.message); }

    return response.data.id;
  } catch (err) {
    console.error('❌ Folder creation failed:', err.message);
    throw err;
  }
};

/**
 * Upload a file to Google Drive
 * @param {string} filePath - Local path to the file
 * @param {string} fileName - Name for the file on Drive
 * @param {string} mimeType - MIME type of the file
 * @param {string} folderId - Target folder ID
 * @returns {Promise<{driveId: string, viewLink: string} | null>}
 */
exports.uploadToDrive = async (filePath, fileName, mimeType = 'application/pdf', folderId = process.env.GOOGLE_DRIVE_FOLDER_ID) => {
  if (!drive) {
    console.warn('⚠️ Google Drive not initialized. Please check GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON in .env');
    return null;
  }

  try {
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
      fields: 'id, webViewLink',
      supportsAllDrives: true // Important for shared drives
    });

    console.log(`✅ File created on Drive. ID: ${response.data.id}`);

    // Make file readable by anyone with the link
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true
      });
    } catch (permErr) {
      console.warn('⚠️ Could not set public permissions on Drive file:', permErr.message);
      if (permErr.message.includes('insufficient authentication scopes')) {
        console.error('👉 Suggestion: The Refresh Token lacks the full "drive" scope. Please regenerate it.');
      }
    }

    return {
      driveId: response.data.id,
      viewLink: response.data.webViewLink
    };
  } catch (err) {
    console.error('❌ Google Drive upload failed:', err.message);
    
    // Detailed error guidance
    if (err.message.includes('insufficient authentication scopes')) {
      console.error('👉 CAUSE: The OAuth2 Refresh Token does not have "https://www.googleapis.com/auth/drive" scope.');
      console.error('👉 FIX: Run "node backend/getRefreshToken.js" and update GOOGLE_DRIVE_REFRESH_TOKEN on Render.');
    } else if (err.message.includes('access_denied') || err.message.includes('403')) {
      console.error('👉 CAUSE: The user has not granted permission or the Folder ID is inaccessible.');
      console.error('👉 FIX: Ensure the folder is shared with the email used for OAuth2, or use a folder you own.');
    } else if (err.message.includes('storageQuotaExceeded')) {
      console.error('👉 CAUSE: The Google Drive storage is full.');
    }
    
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
      { 
        fileId: fileId, 
        alt: 'media',
        supportsAllDrives: true
      },
      { responseType: 'arraybuffer' }
    );
    return Buffer.from(response.data);
  } catch (err) {
    console.error(`❌ Failed to download file ${fileId} from Drive:`, err.message);
    throw err;
  }
};
