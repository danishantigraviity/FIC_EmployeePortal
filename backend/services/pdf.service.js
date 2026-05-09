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

      // Detect file extension from URL or fallback
      let fileExtension = 'pdf';
      if (docInfo.url && docInfo.url.includes('.')) {
        fileExtension = docInfo.url.split('?')[0].split('.').pop().toLowerCase();
      }

      // If it's a Drive link, the extension might be missing, 
      // so we check if it's a known image type or assume PDF
      const isImage = ['jpg', 'jpeg', 'png'].includes(fileExtension);
      const isPdf = fileExtension === 'pdf' || (!isImage && docInfo.publicId);

      if (isPdf) {
        const donorPdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        pagesAdded += copiedPages.length;
      } else if (isImage) {
        let image;
        if (fileExtension === 'png') {
          image = await mergedPdf.embedPng(fileBuffer);
        } else {
          image = await mergedPdf.embedJpg(fileBuffer);
        }

        const page = mergedPdf.addPage();
        const { width, height } = page.getSize();
        
        // Scale image to fit page
        const dims = image.scaleToFit(width - 40, height - 40);
        page.drawImage(image, {
          x: (width - dims.width) / 2,
          y: (height - dims.height) / 2,
          width: dims.width,
          height: dims.height,
        });
        pagesAdded++;
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
