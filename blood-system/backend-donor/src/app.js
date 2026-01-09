const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
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
    res.json({ message: 'Donor Backend API', status: 'running', service: 'donor' });
});

// Routes - Donor service needs donors, requests, auth, and users
const authRoutes = require('./modules/auth/routes/auth');
const donorRoutes = require('./modules/donor/routes/routes');
const requestRoutes = require('./modules/request/routes/routes');
const userRoutes = require('./modules/users/routes/users');

// Mount routes with and without /api prefix to support both Gateway and Direct Nginx access
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/donors', donorRoutes);
app.use('/donors', donorRoutes);

app.use('/api/requests', requestRoutes);
app.use('/requests', requestRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

// Mock Chat Route to prevent 404s
app.get('/api/chat/unread-count', (req, res) => {
    res.json({ success: true, data: { unreadCount: 0 } });
});

app.get('/api/notifications/unread', (req, res) => {
    res.json({ success: true, data: [] });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// 404 for unhandled routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found on Donor Backend' });
});

module.exports = app;
