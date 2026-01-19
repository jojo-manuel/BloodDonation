const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    // Allow all when in Docker
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ message: 'Login Backend API', status: 'running', service: 'login' });
});

// Routes - Login service only needs auth and users
// Routes - Login service only needs auth and users
const fs = require('fs');
const path = require('path');

console.log('Checking paths...');
const authPath = path.join(__dirname, 'modules/auth/routes/auth.js');
const userPath = path.join(__dirname, 'modules/users/routes/users.js');
console.log(`Auth Path: ${authPath} - Exists: ${fs.existsSync(authPath)}`);
console.log(`User Path: ${userPath} - Exists: ${fs.existsSync(userPath)}`);

let authRoutes, userRoutes;
try {
    authRoutes = require('./modules/auth/routes/auth');
    console.log('Auth routes loaded');
} catch (e) {
    console.error('Failed to load auth routes:', e);
}

try {
    userRoutes = require('./modules/users/routes/users');
    console.log('User routes loaded');
} catch (e) {
    console.error('Failed to load user routes:', e);
}

if (authRoutes) app.use('/api/auth', authRoutes);
if (userRoutes) app.use('/api/users', userRoutes);

// Stub routes for chat - Login page doesn't need chat but frontend may request it
// Return empty/zero responses to prevent 404 errors
app.get('/api/chat/unread-count', (req, res) => {
    res.json({ success: true, data: { count: 0 } });
});
app.get('/api/chat/conversations', (req, res) => {
    res.json({ success: true, data: [] });
});
app.get('/api/notifications', (req, res) => {
    res.json({ success: true, data: [] });
});

// DEBUG: List all users
const User = require('./modules/auth/models/User');
app.get('/api/debug/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email role username hospital_id isActive');
        res.json({ success: true, count: users.length, users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// 404 for unhandled routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found on Login Backend' });
});

module.exports = app;
