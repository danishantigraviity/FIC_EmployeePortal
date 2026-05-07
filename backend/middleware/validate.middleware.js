const Joi = require('joi');

exports.validateBody = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => ({ field: d.path[0], message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
};

exports.schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required().messages({ 'string.pattern.base': 'Enter valid 10-digit Indian phone' }),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
      .messages({ 'string.pattern.base': 'Password must have uppercase, lowercase and number' }),
    confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' }),
    token: Joi.string().required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  profile: Joi.object({
    dob: Joi.date().max('now').optional().allow(null, ''),
    gender: Joi.string().valid('male', 'female', 'other').optional().allow(''),
    address: Joi.object({
      street: Joi.string().optional().allow(''),
      city: Joi.string().optional().allow(''),
      state: Joi.string().optional().allow(''),
      pincode: Joi.string().pattern(/^\d{6}$/).optional().allow(''),
      country: Joi.string().optional().allow(''),
    }).optional(),
    aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional().allow('').messages({ 'string.pattern.base': 'Aadhaar must be 12 digits' }),
    panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow('').messages({ 'string.pattern.base': 'Invalid PAN format' }),
    emergencyContact: Joi.object({
      name: Joi.string().optional().allow(''),
      relation: Joi.string().optional().allow(''),
      phone: Joi.string().optional().allow(''),
    }).optional(),
    isFresher: Joi.boolean().optional(),
  }).unknown(true),
  education: Joi.object({
    degree: Joi.string().required(),
    college: Joi.string().required(),
    university: Joi.string().optional(),
    year: Joi.number().min(1990).max(new Date().getFullYear()).required(),
    percentage: Joi.number().min(0).max(100).optional(),
    specialization: Joi.string().optional(),
  }),
  experience: Joi.object({
    companyName: Joi.string().required(),
    role: Joi.string().required(),
    startYear: Joi.number().optional(),
    endYear: Joi.number().optional(),
    years: Joi.number().optional(),
    skills: Joi.array().items(Joi.string()).optional(),
    description: Joi.string().optional(),
    isCurrent: Joi.boolean().optional(),
    idCard: Joi.string().optional(),
    portfolio: Joi.string().optional(),
    certificateUrl: Joi.string().optional(),
  }),
};
