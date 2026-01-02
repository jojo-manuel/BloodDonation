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
    // Disable additional isolation policies to fix lingering COEP issues
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  })
);

// ... (existing code) ...

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, 'public');

  // 🔍 DEBUG: Log static file status
  console.log('📂 Static Assets Path:', staticPath);
  try {
    if (fs.existsSync(staticPath)) {
      console.log('✅ Static folder exists. Contents:', fs.readdirSync(staticPath));
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

