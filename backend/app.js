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
app.use(helmet());

// ✅ CORS configuration: include frontend dev ports
const allowedOrigins = [
  'http://localhost:5173',   // Vite default
  'http://127.0.0.1:5173',
  'http://localhost:5174',   // Vite preview
  'http://127.0.0.1:5174',
  'http://localhost:5175',   // Other dev port
  'http://127.0.0.1:5175',
  'http://localhost:5176',   // ✅ Add your current frontend port
  'http://127.0.0.1:5176',  // ✅ Just in case
];

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (e.g., Postman) with no Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.warn(`CORS blocked request from origin: ${origin}`);
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
app.use('/api/donors', require('./Route/donorRoutes'));

// 404 fallback for unmatched routes
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Centralized error handler
app.use(errorHandler);

module.exports = app;

