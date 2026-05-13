console.log('--- SERVER STARTUP SEQUENCE ---');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
require('dotenv').config();

console.log('--- CONFIG LOADED ---');

const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const educationRoutes = require('./routes/education.routes');
const experienceRoutes = require('./routes/experience.routes');
const documentRoutes = require('./routes/document.routes');
const adminRoutes = require('./routes/admin.routes');


const app = express();

// Trust Proxy (Required for Render/Vercel load balancers)
app.set('trust proxy', 1);

// Absolute Root Route (for health checks)
app.all('/', (req, res) => res.json({ 
  success: true, 
  message: 'Forge India Employee Portal Production API is live',
  status: 'online',
  timestamp: new Date().toISOString()
}));

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
  frameguard: { action: 'sameorigin' }, // Better security than false, allows same-origin iframes
}));

// Sanitize data
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Performance
app.use(compression()); // Compress all responses

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
    if (!origin) return callback(null, true);
    const isVercelPreview = origin.endsWith('.vercel.app');
    const isAllowed = allowedOrigins.indexOf(origin) !== -1 || isVercelPreview;
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['set-cookie']
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
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/uploads', express.static(uploadsPath));


// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/experience', experienceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);


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

// Start Server immediately so Render can detect the port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  // Connect to MongoDB in background after server is up
  connectDB().catch(err => {
    console.error('❌ Initial DB connection failed:', err.message);
    console.log('⚠️ Server is running but DB is not connected. Retrying on next request...');
  });
});

module.exports = app;
