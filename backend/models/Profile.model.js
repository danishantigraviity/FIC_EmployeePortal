const mongoose = require('mongoose');
const { encrypt, decrypt, createBlindIndex } = require('../utils/crypto.utils');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },

  // Aadhaar: Encrypted for storage, indexed for uniqueness
  aadhaarNumber: { 
    type: String, 
    get: decrypt 
    // Setter handled in pre-save to manage blind index
  },
  aadhaarIndex: { type: String, unique: true, sparse: true },

  // PAN: Encrypted for storage, indexed for uniqueness
  panNumber: { 
    type: String, 
    get: decrypt,
    uppercase: true
  },
  panIndex: { type: String, unique: true, sparse: true },

  emergencyContact: {
    name: String,
    relation: String,
    phone: String
  },

  bankDetails: {
    bankName: String,
    accountNumber: { 
      type: String, 
      get: decrypt 
    },
    accountIndex: { type: String, unique: true, sparse: true },
    ifscCode: String,
  },

  profilePhoto: { type: String },
  isFresher: { type: Boolean, default: false },
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

/**
 * Pre-save middleware to handle encryption and blind indexing.
 * This ensures that if a sensitive field is changed, its corresponding
 * blind index is updated with a hash of the RAW value.
 */
profileSchema.pre('save', function(next) {
  // 1. Aadhaar
  if (this.isModified('aadhaarNumber') && this.aadhaarNumber) {
    // If the value is already encrypted (length > 60 usually for hex iv+tag+cipher), 
    // we don't want to re-encrypt. But usually, we assign raw values in controllers.
    if (this.aadhaarNumber.length < 60) { 
      this.aadhaarIndex = createBlindIndex(this.aadhaarNumber);
      this.aadhaarNumber = encrypt(this.aadhaarNumber);
    }
  }

  // 2. PAN
  if (this.isModified('panNumber') && this.panNumber) {
    if (this.panNumber.length < 60) {
      this.panIndex = createBlindIndex(this.panNumber);
      this.panNumber = encrypt(this.panNumber);
    }
  }

  // 3. Bank Account
  if (this.isModified('bankDetails.accountNumber') && this.bankDetails.accountNumber) {
    if (this.bankDetails.accountNumber.length < 60) {
      this.bankDetails.accountIndex = createBlindIndex(this.bankDetails.accountNumber);
      this.bankDetails.accountNumber = encrypt(this.bankDetails.accountNumber);
    }
  }

  next();
});

module.exports = mongoose.model('Profile', profileSchema);
