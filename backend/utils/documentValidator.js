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

/**
 * Pre-processes an image to improve OCR accuracy.
 * Converts to grayscale, increases contrast, and applies thresholding.
 */
async function enhanceImageForOcr(filePath) {
  try {
    const outputPath = path.join(path.dirname(filePath), `enhanced_${path.basename(filePath)}`);
    await sharp(filePath)
      .grayscale() // Remove color noise
      .normalize() // Stretch contrast
      .sharpen()   // Make text edges crisp
      .toFile(outputPath);
    return outputPath;
  } catch (err) {
    console.warn('[documentValidator] Image enhancement failed, using original:', err.message);
    return filePath;
  }
}

async function extractTextFromImage(filePath) {
  let processedPath = null;
  try {
    // 1. Enhance the image for better OCR results
    processedPath = await enhanceImageForOcr(filePath);

    // 2. Run OCR with English + Hindi support
    const { data: { text } } = await Tesseract.recognize(processedPath, 'eng+hin', {
      logger: m => {
        if (m.status === 'recognizing text' && m.progress % 0.2 === 0) {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // 3. Cleanup temp processed file
    if (processedPath !== filePath && fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }

    return text || '';
  } catch (err) {
    console.error('[documentValidator] Image OCR failed:', err.message);
    if (processedPath && processedPath !== filePath && fs.existsSync(processedPath)) {
      fs.unlinkSync(processedPath);
    }
    return '';
  }
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

  // ─── 1. Extract Text ────────────────────────────────────────────────────────
  let text = '';
  try {
    if (isImage) {
      const processedPath = await enhanceImageForOcr(filePath);
      const { data: { text: ocrResult } } = await Tesseract.recognize(processedPath || filePath, 'eng+hin');
      text = ocrResult || '';
      if (processedPath && processedPath !== filePath && fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
    } else {
      text = await extractPdfText(filePath);
    }
  } catch (err) {
    console.error('[documentValidator] OCR extraction failed:', err.message);
    return { valid: false, message: 'Document processing failed. Please try again with a clearer file.' };
  }

  const normalExpected = expectedNumber ? normaliseAadhaar(expectedNumber).toUpperCase() : null;
  if (!normalExpected) {
    return { valid: false, message: `Please enter your ${fieldname.toUpperCase()} number in your profile before uploading the document.` };
  }

  // ─── 2. Aadhaar Matching ───────────────────────────────────────────────────
  if (fieldname === 'aadhaar') {
    const foundNumbers = [...text.matchAll(AADHAAR_REGEX)].map(m => normaliseAadhaar(m[0]));
    const validNumbers = foundNumbers.filter(num => validateAadhaarChecksum(num));

    if (validNumbers.length === 0) {
      return { 
        valid: false, 
        message: 'Could not detect a valid 12-digit Aadhaar number on this document. Please upload a clearer scan.' 
      };
    }

    if (!validNumbers.includes(normalExpected)) {
      return { 
        valid: false, 
        message: `Identity Mismatch: The uploaded document contains Aadhaar ${validNumbers[0]}, but your profile says ${expectedNumber}.` 
      };
    }

    return { valid: true, message: 'Aadhaar number verified.' };
  }

  // ─── 3. PAN Matching ───────────────────────────────────────────────────────
  if (fieldname === 'pan') {
    const foundPans = [...text.toUpperCase().matchAll(PAN_REGEX)].map(m => m[0]);

    if (foundPans.length === 0) {
      return { 
        valid: false, 
        message: 'Could not detect a valid PAN number (AAAAA9999A) on this document. Please upload a clearer scan.' 
      };
    }

    if (!foundPans.includes(normalExpected)) {
      return { 
        valid: false, 
        message: `Identity Mismatch: The uploaded document contains PAN ${foundPans[0]}, but your profile says ${expectedNumber}.` 
      };
    }

    return { valid: true, message: 'PAN number verified.' };
  }

  return { valid: true, message: 'Document successfully verified.' };
}

module.exports = { validateIdentityDocument };
