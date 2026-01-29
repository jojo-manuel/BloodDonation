// app.js
// Express application configuration: security, CORS, logging, parsers, and route mounting.

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const errorHandler = require('./Middleware/errorhandle');
const path = require('path');
const fs = require('fs');

// Load environment variables for configuration
require('dotenv').config();

const app = express();

// Basic security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://checkout.razorpay.com"],
        frameSrc: ["'self'", "https://api.razorpay.com"],
        imgSrc: ["'self'", "data:", "https://*.razorpay.com"],
        connectSrc: ["'self'", "https://lumberjack.razorpay.com", "https://*.razorpay.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// 🛡️ FORCE MANUAL HEADERS to override any defaults
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// ✅ CORS configuration: include frontend dev ports and production URLs
const allowedOrigins = [
  'http://localhost:5173',   // Vite default
  'http://127.0.0.1:5173',
  'http://localhost:5174',   // Vite preview
  'http://127.0.0.1:5174',
  'http://localhost:5175',   // Other dev port
  'http://127.0.0.1:5175',
  'http://localhost:5176',   // Additional dev ports
  'http://127.0.0.1:5176',
  'http://localhost:3000',   // React default
  'http://127.0.0.1:3000',
  'http://localhost:8080',   // Common dev port
  'http://127.0.0.1:8080',
  'https://blood-frontend-f9sy.onrender.com', // Production Frontend
  'https://blood-backend-vd5d.onrender.com',   // Production Backend (self - old?)
  'https://blood-backend-f9sy.onrender.com'    // Production Backend (new inferred)
];

// Add production origins from environment variable
if (process.env.CORS_ORIGIN) {
  const productionOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  allowedOrigins.push(...productionOrigins);
  console.log('🌐 Production CORS origins added:', productionOrigins);
}

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (e.g., Postman) with no Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn(`❌ CORS blocked request from origin: ${origin}`);
    console.warn(`✅ Allowed origins:`, allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Request logging (dev format)
app.use(morgan('dev'));

// JSON body parser with sane payload limit
app.use(express.json({ limit: '1mb' }));

// Cookie parser for signed/unsigned cookies
app.use(cookieParser());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

app.use('/uploads', express.static(uploadsDir));

// Passport middleware
app.use(passport.initialize());

// Rate-limiter for auth endpoints to mitigate brute-force
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

// Health check endpoint
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// Mount routes (note: auth routes are behind rate limiter)
app.use('/api/auth', authLimiter, require('./Route/authRoutes'));
app.use('/api/users', require('./Route/userRoutes'));
app.use('/api/settings', require('./Route/settingsRoutes'));
app.use('/api/donors', require('./Route/donorRoutes'));
app.use('/api/reviews', require('./Route/reviewRoutes'));
app.use('/api/admin', require('./Route/adminRoutes'));
app.use('/api/patients', require('./Route/PatientCURD'));
app.use('/api/bloodbank', require('./Route/bloodbankRoutes'));
app.use('/api/bloodbank-manager', require('./Route/bloodbankManagerRoutes'));
app.use('/api/store-manager', require('./Route/storeManagerRoutes'));
app.use('/api/chat', require('./Route/chatRoutes'));
// Taxi booking feature removed
app.use('/api/notifications', require('./Route/notificationRoutes'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, 'public');

  // 🔍 DEEP DEBUG: Recursive file listing
  console.log('📂 Static Assets Path:', staticPath);
  console.log('📂 CWD:', process.cwd());

  try {
    if (fs.existsSync(staticPath)) {
      const getFiles = (dir) => {
        const subdirs = fs.readdirSync(dir, { withFileTypes: true });
        const files = subdirs.map((dirent) => {
          const res = path.resolve(dir, dirent.name);
          return dirent.isDirectory() ? getFiles(res) : res;
        });
        return Array.prototype.concat(...files);
      };
      const allFiles = getFiles(staticPath);
      console.log('✅ All Static Files:', allFiles);
    } else {
      console.error('❌ Static folder MISSING at:', staticPath);
    }
  } catch (err) {
    console.error('❌ Error reading static folder:', err);
  }

  // Set static folder
  app.use(express.static(staticPath));

  // Handle SPA fallback
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// 404 fallback for unmatched routes (API)
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Centralized error handler
app.use(errorHandler);

module.exports = app;

