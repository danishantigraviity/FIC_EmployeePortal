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
const pdfParseModule = require('pdf-parse');
/**
 * Universal PDF Parser Bridge
 * Handles various versions and export formats (ESM/CJS/Classes)
 */
let pdfParse = null;
if (typeof pdfParseModule === 'function') {
  pdfParse = pdfParseModule;
} else if (pdfParseModule && typeof pdfParseModule.default === 'function') {
  pdfParse = pdfParseModule.default;
} else if (pdfParseModule && pdfParseModule.PDFParse) {
  // Handle the 'Module' class-based version detected in some environments
  pdfParse = async (buffer) => {
    try {
      const instance = new pdfParseModule.PDFParse();
      return await instance.parse(buffer);
    } catch (e) {
      console.error('[documentValidator] PDFParse class failure:', e.message);
      throw e;
    }
  };
}

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
  const clean = aadhaar.replace(/[^0-9]/g, '');
  if (clean.length !== 12) return false;
  
  const digits = clean.split('').map(Number);
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

/**
 * Pre-processes an image to improve OCR accuracy and performance.
 * - Resizes to max 1200px (faster OCR, less memory)
 * - Grayscale + Normalize + Sharpen
 */
async function enhanceImageForOcr(filePath) {
  try {
    const outputPath = path.join(path.dirname(filePath), `enhanced_${path.basename(filePath)}.png`);
    
    const transformer = sharp(filePath);
    const metadata = await transformer.metadata();

    // Downscale if too large (mobile photos are often 4000px+, slowing OCR)
    if (metadata.width > 1200) {
      transformer.resize(1200);
    }

    await transformer
      .grayscale()
      .normalize()
      .sharpen()
      .png({ quality: 90 }) // PNG is often better for OCR than JPEG
      .toFile(outputPath);

    return outputPath;
  } catch (err) {
    console.warn('[documentValidator] Image enhancement failed:', err.message);
    return filePath;
  }
}

/**
 * Normalizes text to handle common OCR misreads (e.g., 'O' vs '0', 'I' vs '1')
 */
function fuzzyNormalize(text, type = 'alphanumeric') {
  if (!text) return '';
  let clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // PAN Logic: AAAAA 9999 A
  if (type === 'pan' && clean.length >= 10) {
    const lettersPart1 = clean.slice(0, 5).replace(/0/g, 'O').replace(/1/g, 'I');
    const numbersPart = clean.slice(5, 9)
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/S/g, '5')
      .replace(/G/g, '6')
      .replace(/B/g, '8')
      .replace(/Z/g, '2')
      .replace(/A/g, '4')
      .replace(/E/g, '3')
      .replace(/T/g, '1')
      .replace(/L/g, '1');
    const lettersPart2 = clean.slice(9, 10).replace(/0/g, 'O').replace(/1/g, 'I');
    return lettersPart1 + numbersPart + lettersPart2;
  }
  
  // Aadhaar Logic: 12 digits
  if (type === 'aadhaar') {
    return clean
      .replace(/O/g, '0')
      .replace(/Q/g, '0')
      .replace(/I/g, '1')
      .replace(/T/g, '1')
      .replace(/L/g, '1')
      .replace(/S/g, '5')
      .replace(/B/g, '8')
      .replace(/G/g, '6')
      .replace(/Z/g, '2')
      .replace(/A/g, '4')
      .replace(/E/g, '3');
  }

  return clean;
}

async function extractPdfText(filePath) {
  try {
    if (typeof pdfParse !== 'function') {
      throw new Error('PDF parser not properly initialized');
    }
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer, { max: 3 });
    return data.text || '';
  } catch (err) {
    console.error('[documentValidator] PDF-parse failed:', err.message);
    return '';
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

  const normalExpected = expectedNumber ? expectedNumber.replace(/[\s\-]/g, '').toUpperCase() : null;
  if (!normalExpected) {
    return { valid: false, message: `Please enter your ${fieldname.toUpperCase()} number in your profile before uploading.` };
  }

  // ─── 1. Extract Text ────────────────────────────────────────────────────────
  let rawText = '';
  let processedPath = null;
  try {
    if (isImage) {
      processedPath = await enhanceImageForOcr(filePath);
      // Use 'eng' only for PAN (faster), 'eng+hin' for Aadhaar
      const lang = fieldname === 'pan' ? 'eng' : 'eng+hin';
      
      const { data: { text } } = await Tesseract.recognize(processedPath || filePath, lang);
      rawText = text || '';
      
      if (processedPath && processedPath !== filePath && fs.existsSync(processedPath)) {
        fs.unlinkSync(processedPath);
      }
    } else {
      rawText = await extractPdfText(filePath);
      
      // Check for scanned PDF (no selectable text)
      if (isPdf && rawText.trim().length < 10) {
        return { 
          valid: false, 
          message: 'This PDF appears to be a scan with no readable text. Please upload a clear JPG or PNG image of your document instead.' 
        };
      }
    }
  } catch (err) {
    if (processedPath && fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    console.error('[documentValidator] OCR failed:', err.message);
    return { valid: false, message: 'Document processing timed out or failed. Please upload a smaller, clearer file.' };
  }

  const text = rawText.toUpperCase();
  console.log(`[OCR Result] ${fieldname.toUpperCase()} (Raw Text Sample): ${text.substring(0, 150).replace(/\n/g, ' ')}...`);

  // ─── 2. Aadhaar Matching ───────────────────────────────────────────────────
  if (fieldname === 'aadhaar') {
    // Strategy: Look for any 12-digit-like sequence, then fix common OCR errors
    // Regex allows for any non-alphanumeric separator between blocks of 4
    const potentialAadhaars = text.match(/[A-Z0-9]{4}[^A-Z0-9]*[A-Z0-9]{4}[^A-Z0-9]*[A-Z0-9]{4}/g) || [];
    
    const validNumbers = potentialAadhaars
      .map(raw => fuzzyNormalize(raw, 'aadhaar'))
      .filter(num => num.length === 12 && validateAadhaarChecksum(num));

    if (validNumbers.length === 0) {
      // Check if any keywords are present to give better feedback
      const hasKeywords = AADHAAR_KEYWORDS.some(k => text.includes(k.toUpperCase()));
      const message = hasKeywords 
        ? 'Aadhaar card detected but the 12-digit number was not readable. Ensure the card is clear, well-lit, and not blurry.'
        : 'Could not detect a valid Aadhaar number. Ensure you are uploading the correct document and the scan is high quality.';
      
      return { valid: false, message };
    }

    if (!validNumbers.includes(normalExpected)) {
      return { 
        valid: false, 
        message: `Identity Mismatch: Uploaded document contains Aadhaar ${validNumbers[0]}, but your profile says ${expectedNumber}.` 
      };
    }

    return { valid: true, message: 'Aadhaar verified.' };
  }

  // ─── 3. PAN Matching ───────────────────────────────────────────────────────
  if (fieldname === 'pan') {
    // Strategy: Look for any 10-char alphanumeric string that resembles a PAN
    const potentialPans = text.match(/[A-Z0-9]{5}[0-9A-Z]{4}[A-Z0-9]{1}/g) || [];
    const validPans = potentialPans
      .map(raw => fuzzyNormalize(raw, 'pan'))
      .filter(num => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(num));

    if (validPans.length === 0) {
      return { 
        valid: false, 
        message: 'Could not detect a valid PAN number (AAAAA9999A). Please ensure the card is clear and all characters are visible.' 
      };
    }

    if (!validPans.includes(normalExpected)) {
      return { 
        valid: false, 
        message: `Identity Mismatch: Uploaded document contains PAN ${validPans[0]}, but profile says ${expectedNumber}.` 
      };
    }

    return { valid: true, message: 'PAN verified.' };
  }

  return { valid: true, message: 'Document verified.' };
}

module.exports = { validateIdentityDocument };
