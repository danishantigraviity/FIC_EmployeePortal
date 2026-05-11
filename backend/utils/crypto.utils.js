/**
 * crypto.utils.js
 * Transparent data encryption for sensitive fields.
 * Uses AES-256-GCM for authenticated encryption.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

// Ensure we have a 32-byte key
const getEncryptionKey = () => {
  const secret = process.env.DATA_ENCRYPTION_KEY || process.env.JWT_SECRET || 'fic-portal-data-encryption-secret-fallback';
  return crypto.createHash('sha256').update(secret).digest();
};

/**
 * Encrypts plain text into a combined hex string [iv][authTag][ciphertext]
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}${authTag}${encrypted}`;
}

/**
 * Decrypts a combined hex string back to plain text
 */
function decrypt(combined) {
  if (!combined || combined.length < (IV_LENGTH * 2) + (AUTH_TAG_LENGTH * 2)) return combined;
  
  try {
    const iv = Buffer.from(combined.slice(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(combined.slice(IV_LENGTH * 2, (IV_LENGTH * 2) + (AUTH_TAG_LENGTH * 2)), 'hex');
    const encryptedText = combined.slice((IV_LENGTH * 2) + (AUTH_TAG_LENGTH * 2));
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.warn('[crypto.utils] Decryption failed, returning raw string. Error:', err.message);
    return combined; // Fallback to raw if decryption fails (e.g. for legacy data)
  }
}

/**
 * Creates a deterministic hash for uniqueness checks (Blind Indexing)
 */
function createBlindIndex(text) {
  if (!text) return text;
  return crypto.createHmac('sha256', getEncryptionKey())
    .update(text.toString().trim().toUpperCase())
    .digest('hex');
}

module.exports = { encrypt, decrypt, createBlindIndex };
