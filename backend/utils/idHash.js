/**
 * idHash.js - HMAC-based ID obfuscation for URLs
 *
 * Converts raw MongoDB ObjectIDs to opaque URL-safe tokens and back.
 * Uses HMAC-SHA256 with an app secret — no extra dependencies needed.
 *
 * encode('6a01640613d37445de932a2f') → 'em8fXKs3...qA' (URL-safe base64)
 * decode('em8fXKs3...qA')           → '6a01640613d37445de932a2f'
 */

const crypto = require('crypto');

const SECRET = process.env.ID_HASH_SECRET || process.env.JWT_SECRET || 'fic-portal-id-secret-fallback';
const SEPARATOR = ':';

/**
 * Encodes a MongoDB ObjectID string into an opaque URL-safe token.
 * @param {string} id  - Raw MongoDB ObjectID hex string (24 chars)
 * @returns {string}   - URL-safe base64 token
 */
function encodeId(id) {
  if (!id) return id;
  const idStr = id.toString();
  const hmac = crypto.createHmac('sha256', SECRET).update(idStr).digest('hex').slice(0, 16);
  const payload = `${idStr}${SEPARATOR}${hmac}`;
  return Buffer.from(payload).toString('base64url');
}

/**
 * Decodes an opaque URL token back to a MongoDB ObjectID string.
 * Throws if the token has been tampered with.
 * @param {string} token - URL-safe base64 token
 * @returns {string}     - Raw MongoDB ObjectID hex string
 */
function decodeId(token) {
  if (!token) throw new Error('Missing ID token');
  try {
    const payload = Buffer.from(token, 'base64url').toString('utf8');
    const lastColon = payload.lastIndexOf(SEPARATOR);
    if (lastColon === -1) throw new Error('Invalid token format');
    const idStr = payload.slice(0, lastColon);
    const providedHmac = payload.slice(lastColon + 1);
    const expectedHmac = crypto.createHmac('sha256', SECRET).update(idStr).digest('hex').slice(0, 16);
    if (providedHmac !== expectedHmac) throw new Error('Token integrity check failed');
    return idStr;
  } catch (err) {
    throw new Error('Invalid or tampered ID token');
  }
}

module.exports = { encodeId, decodeId };
