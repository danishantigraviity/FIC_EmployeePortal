const { PDFDocument } = require('pdf-lib');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const driveService = require('./drive.service');

const PDF_ORDER = [
  'aadhaar',
  'pan',
  'tenthCertificate',
  'twelfthCertificate',
  'degreeProvisional',
  'pgProvisional',
  'experienceCertificate',
  'bankPassbook'
];

exports.generateCompiledPdf = async (documents, userId) => {
  const mergedPdf = await PDFDocument.create();
  let pagesAdded = 0;

  for (const key of PDF_ORDER) {
    const docInfo = documents[key];
    if (!docInfo || !docInfo.url) continue;

    try {
      let fileBuffer;
      
      // Try to download from Drive first if we have a publicId (which is the driveId)
      if (docInfo.publicId && !docInfo.publicId.includes('.')) {
        fileBuffer = await driveService.downloadFromDrive(docInfo.publicId);
      } else if (docInfo.url.startsWith('http')) {
        const response = await axios.get(docInfo.url, { responseType: 'arraybuffer' });
        fileBuffer = Buffer.from(response.data);
      } else {
        // Local path
        const localPath = path.join(__dirname, '../', docInfo.url.replace(/^[/\\]/, ''));
        fileBuffer = await fs.readFile(localPath);
      }

      // Process file based on content rather than extension
      console.log(`🔍 Processing ${key}...`);
      
      // Try to load as PDF first
      try {
        const donorPdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        pagesAdded += copiedPages.length;
        console.log(`✅ Processed ${key} as PDF`);
      } catch (pdfErr) {
        // If PDF fails, try as Image
        try {
          let image;
          // Try embedding as PNG first, then JPG
          try {
            image = await mergedPdf.embedPng(fileBuffer);
          } catch (pngErr) {
            image = await mergedPdf.embedJpg(fileBuffer);
          }

          const page = mergedPdf.addPage();
          const { width, height } = page.getSize();
          const dims = image.scaleToFit(width - 40, height - 40);
          page.drawImage(image, {
            x: (width - dims.width) / 2,
            y: (height - dims.height) / 2,
            width: dims.width,
            height: dims.height,
          });
          pagesAdded++;
          console.log(`✅ Processed ${key} as Image`);
        } catch (imgErr) {
          console.error(`❌ Failed to process ${key} as both PDF and Image:`, imgErr.message);
        }
      }
    } catch (err) {
      console.error(`Failed to process ${key}:`, err.message);
    }
  }

  if (pagesAdded === 0) throw new Error('No valid documents found to merge');

  const pdfBytes = await mergedPdf.save();
  const fileName = `compiled_${userId}_${Date.now()}.pdf`;
  const relativePath = `uploads/compiled/${fileName}`;
  const fullPath = path.join(__dirname, '../', relativePath);

  // Ensure directory exists
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, pdfBytes);

  return {
    url: `/uploads/compiled/${fileName}`,
    path: fullPath,
    fileName
  };
};
