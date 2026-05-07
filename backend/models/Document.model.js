const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  aadhaar: { url: String, publicId: String, uploadedAt: Date },
  pan: { url: String, publicId: String, uploadedAt: Date },
  resume: { url: String, publicId: String, uploadedAt: Date },
  profilePhoto: { url: String, publicId: String, uploadedAt: Date },
  tenthCertificate: { url: String, publicId: String, uploadedAt: Date },
  twelfthCertificate: { url: String, publicId: String, uploadedAt: Date },
  degreeProvisional: { url: String, publicId: String, uploadedAt: Date },
  pgProvisional: { url: String, publicId: String, uploadedAt: Date },
  experienceCertificate: { url: String, publicId: String, uploadedAt: Date },
  bankPassbook: { url: String, publicId: String, uploadedAt: Date },
  verificationStatus: {
    aadhaar: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    pan: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    resume: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    tenthCertificate: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    twelfthCertificate: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    degreeProvisional: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    pgProvisional: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    experienceCertificate: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    bankPassbook: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  },
  compiledPdf: {
    url: String,
    driveId: String,
    driveViewLink: String,
    generatedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
