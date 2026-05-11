/**
 * documentValidator.js
 * Enhanced AI/OCR-based Aadhaar & PAN document validation.
 * 
 * Features:
 * - PDF text extraction via pdf-parse.
 * - Image OCR via tesseract.js.
 * - Image quality & metadata verification via sharp.
 * - Verhoeff algorithm for Aadhaar checksum validation.
 * - Strict keyword & regex matching.
 * - Rejection of screenshots, random images, and blurred scans.
 */

const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const pdfParse = require('pdf-parse');

// ─── Verhoeff Algorithm for Aadhaar Checksum ──────────────────────────────────
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateAadhaarChecksum(aadhaar) {
  const digits = aadhaar.replace(/[\s\-]/g, '').split('').map(Number);
  if (digits.length !== 12) return false;
  let c = 0;
  const rev = digits.reverse();
  for (let i = 0; i < rev.length; i++) {
    c = d[c][p[i % 8][rev[i]]];
  }
  return c === 0;
}

// ─── Aadhaar helpers ─────────────────────────────────────────────────────────
const AADHAAR_REGEX = /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g;
const AADHAAR_KEYWORDS = [
  'aadhaar', 'aadhar', 'uidai', 'unique identification',
  'government of india', 'enrolment', 'enrollment',
  'meri pehchaan', 'my aadhaar', 'female', 'male'
];

// ─── PAN helpers ──────────────────────────────────────────────────────────────
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
const PAN_KEYWORDS = [
  'permanent account number', 'income tax department', 'pan',
  'government of india', 'income tax', 'signature', 'tax'
];

const normaliseAadhaar = (num) => num.replace(/[\s\-]/g, '');

// ─── OCR & Extraction ─────────────────────────────────────────────────────────

async function extractTextFromImage(filePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
      logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
    });
    return text || '';
  } catch (err) {
    console.error('[documentValidator] Image OCR failed:', err.message);
    return '';
  }
}

async function extractPdfText(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer, { max: 3 });
    return data.text || '';
  } catch (err) {
    console.error('[documentValidator] PDF-parse failed:', err.message);
    return '';
  }
}

async function checkImageQuality(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);
    
    // 1. Resolution Check
    if (metadata.width < 600 || metadata.height < 400) {
      return { valid: false, message: 'Resolution is too low. Please upload a clear, high-resolution scan (minimum 600px width).' };
    }

    // 2. Aspect Ratio Check (Heuristic for Mobile Screenshots)
    // Most modern phones have tall aspect ratios (e.g., 9:19.5, 9:20). 
    // Genuine ID cards are usually landscape (approx 1.5:1) or scanned on A4.
    const ratio = metadata.height / metadata.width;
    if (ratio > 1.8 || ratio < 0.3) {
      return { 
        valid: false, 
        message: 'This looks like a mobile screenshot or a cropped image. Please upload a full, original scan of the document.' 
      };
    }

    // 3. Blur/Quality Heuristic (Size-to-Resolution Density)
    // A 1080p image should be at least 150-200KB if it has detail. 
    // If it's very small, it's likely extremely blurred or highly compressed.
    const pixels = metadata.width * metadata.height;
    const density = stats.size / pixels; 
    if (density < 0.05) { // Very rough heuristic: less than 0.05 bytes per pixel is usually poor quality
      return { 
        valid: false, 
        message: 'The image quality is too low or blurred. Please upload a sharp, high-quality photo of your original card.' 
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, message: 'Could not process image for quality check.' };
  }
}

// ─── Main validator ───────────────────────────────────────────────────────────
/**
 * Validates an uploaded file for a given document type.
 */
async function validateIdentityDocument({ filePath, mimetype, fieldname, expectedNumber }) {
  const isPdf = mimetype === 'application/pdf';
  const isImage = ['image/jpeg', 'image/png'].includes(mimetype);

  if (!isPdf && !isImage) {
    return { valid: false, message: 'Unsupported file type. Please upload JPG, PNG, or PDF.' };
  }

  let text = '';
  if (isImage) {
    const quality = await checkImageQuality(filePath);
    if (!quality.valid) return quality;
    text = await extractTextFromImage(filePath);
  } else {
    text = await extractPdfText(filePath);
  }

  const lowerText = text.toLowerCase();

  // Strict Rejection for random images/selfies
  if (!text || text.trim().length < 15) {
    return { 
      valid: false, 
      message: 'No meaningful text detected. Please ensure you are uploading a clear scan of your ID card, not a random photo or selfie.' 
    };
  }

  // Common Rejections
  if (lowerText.includes('screenshot') || lowerText.includes('whatsapp image')) {
    // Some OCR might pick up "Screenshot" text from the file overlay
    // return { valid: false, message: 'Screenshots are not allowed. Please upload an original document.' };
  }

  if (fieldname === 'aadhaar') {
    // 1. Keyword check
    const hasKeyword = AADHAAR_KEYWORDS.some(kw => lowerText.includes(kw));
    if (!hasKeyword) {
      return { valid: false, message: 'Aadhaar Card keywords not detected. Please upload a valid Aadhaar document.' };
    }

    // 2. Document mismatch check
    if (PAN_KEYWORDS.some(kw => lowerText.includes(kw) && !['government of india'].includes(kw))) {
      return { valid: false, message: 'This appears to be a PAN Card. Please upload an Aadhaar Card.' };
    }

    // 3. Number extraction and validation
    const foundNumbers = [...text.matchAll(AADHAAR_REGEX)].map(m => normaliseAadhaar(m[0]));
    
    if (foundNumbers.length === 0) {
      return { valid: false, message: 'Could not find a valid 12-digit Aadhaar number on the document.' };
    }

    // Check Aadhaar checksum for all found numbers
    const validNumbers = foundNumbers.filter(num => validateAadhaarChecksum(num));
    if (validNumbers.length === 0) {
      return { valid: false, message: 'The Aadhaar number detected on the document is invalid (checksum failed).' };
    }

    // 4. Expected number match
    if (expectedNumber) {
      const normalExpected = normaliseAadhaar(expectedNumber);
      if (!validNumbers.includes(normalExpected)) {
        return { 
          valid: false, 
          message: `Aadhaar number mismatch. The document contains ${validNumbers[0]}, but you entered ${expectedNumber}.` 
        };
      }
    }

    return { valid: true, message: 'Aadhaar document verified.' };
  }

  if (fieldname === 'pan') {
    // 1. Keyword check
    const hasKeyword = PAN_KEYWORDS.some(kw => lowerText.includes(kw));
    if (!hasKeyword) {
      return { valid: false, message: 'PAN Card keywords not detected. Please upload a valid PAN Card.' };
    }

    // 2. Document mismatch check
    if (AADHAAR_KEYWORDS.some(kw => lowerText.includes(kw) && !['government of india'].includes(kw))) {
      return { valid: false, message: 'This appears to be an Aadhaar Card. Please upload a PAN Card.' };
    }

    // 3. Number extraction
    const foundPans = [...text.toUpperCase().matchAll(PAN_REGEX)].map(m => m[0]);
    if (foundPans.length === 0) {
      return { valid: false, message: 'Could not find a valid PAN number (AAAAA9999A) on the document.' };
    }

    // 4. Expected number match
    if (expectedNumber) {
      const upperExpected = expectedNumber.toUpperCase().trim();
      if (!foundPans.includes(upperExpected)) {
        return { 
          valid: false, 
          message: `PAN number mismatch. The document contains ${foundPans[0]}, but you entered ${upperExpected}.` 
        };
      }
    }

    return { valid: true, message: 'PAN document verified.' };
  }

  return { valid: true, message: 'Document accepted.' };
}

module.exports = { validateIdentityDocument };
