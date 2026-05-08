const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const educationRoutes = require('./routes/education.routes');
const experienceRoutes = require('./routes/experience.routes');
const documentRoutes = require('./routes/document.routes');
const adminRoutes = require('./routes/admin.routes');

// Environment Variable Validation
const requiredEnv = [
  'MONGODB_URI', 'JWT_SECRET', 'EMAIL_USER', 'EMAIL_PASS', 'CLIENT_URL'
];
requiredEnv.forEach(env => {
  if (!process.env[env]) {
    console.error(`❌ CRITICAL: Environment variable ${env} is missing!`);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  }
});

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Robust CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://fic-i2mw.vercel.app',
  'https://fic-employee.vercel.app',
  'https://fic-employee-portal.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const isVercelPreview = origin.endsWith('.vercel.app');
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || isVercelPreview;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for production
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Stricter for auth
  skip: () => process.env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);

// Root route for Render health checks and verification
app.get('/', (req, res) => res.json({ 
  success: true, 
  message: 'Forge India Employee Portal API is live',
  version: '1.1.0',
  docs: 'https://fic-iyyd.onrender.com/health'
}));

// Health check
app.get('/health', (req, res) => res.json({ 
  status: 'OK', 
  env: process.env.NODE_ENV,
  timestamp: new Date().toISOString() 
}));

// 404 handler
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.message);
  if (err.stack && process.env.NODE_ENV !== 'production') console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// DB Connection Cache for Serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState;
    console.log('✅ MongoDB Atlas connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

// Start Server / Handle Serverless
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`));
  });
} else {
  // Vercel handles the listening, but we still need to connect to DB
  app.use(async (req, res, next) => {
    await connectDB();
    next();
  });
}

module.exports = app;
