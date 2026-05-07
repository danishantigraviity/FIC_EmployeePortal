const Profile = require('../models/Profile.model');
const Education = require('../models/Education.model');
const Document = require('../models/Document.model');
const User = require('../models/User.model');

const Experience = require('../models/Experience.model');

exports.calculateCompletion = async (userId) => {
  let score = 0;
  
  // 1. Profile Status
  const profile = await Profile.findOne({ userId });
  const steps = {
    profile: false,
    education: false,
    experience: false,
    documents: false,
    bank: false
  };

  if (profile) {
    if (profile.dob) score += 4;
    if (profile.gender) score += 4;
    if (profile.address?.city) score += 4;
    if (profile.aadhaarNumber) score += 4;
    if (profile.panNumber) score += 4;

    // Check if profile section is complete
    if (profile.dob && profile.gender && profile.address?.city && profile.aadhaarNumber && profile.panNumber) {
      steps.profile = true;
    }

    // 5. Bank Details Status (stored in Profile)
    if (profile.bankDetails?.bankName) score += 3;
    if (profile.bankDetails?.accountNumber) score += 4;
    if (profile.bankDetails?.ifscCode) score += 3;

    if (profile.bankDetails?.bankName && profile.bankDetails?.accountNumber && profile.bankDetails?.ifscCode) {
      steps.bank = true;
    }
  }
  
  // 2. Education Status
  const eduCount = await Education.countDocuments({ userId });
  if (eduCount > 0) {
    score += 10;
    steps.education = true;
  }
  
  // 3. Experience Status
  const expCount = await Experience.countDocuments({ userId });
  if (profile?.isFresher || expCount > 0) {
    score += 20;
    steps.experience = true;
  }
  
  // 4. Documents Status
  const doc = await Document.findOne({ userId });
  if (doc) {
    if (doc.aadhaar?.url) score += 5;
    if (doc.pan?.url) score += 5;
    if (doc.resume?.url) score += 5;
    if (doc.profilePhoto?.url) score += 5;
    if (doc.tenthCertificate?.url) score += 5;
    if (doc.twelfthCertificate?.url) score += 5;
    if (doc.degreeProvisional?.url) score += 5;
    if (doc.pgProvisional?.url) score += 5;
    if (doc.bankPassbook?.url) score += 5;

    // Required docs list
    const required = ['aadhaar', 'pan', 'resume', 'profilePhoto', 'tenthCertificate', 'twelfthCertificate', 'degreeProvisional', 'bankPassbook'];
    const isDocsComplete = required.every(key => doc[key]?.url);
    if (isDocsComplete) {
      steps.documents = true;
    }
  }
  
  const finalScore = Math.min(score, 100);
  await User.findByIdAndUpdate(userId, { 
    profileCompletion: finalScore,
    completedSteps: steps
  });

  return { score: finalScore, steps };
};
