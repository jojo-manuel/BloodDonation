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
    'http://localhost:3003'
];

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
    res.json({ message: 'Blood Bank Monolith Backend API', status: 'running' });
});

// Module Routes Mounting
const authRoutes = require('./modules/auth/routes/auth');
const donorRoutes = require('./modules/donor/routes/routes');
const inventoryRoutes = require('./modules/inventory/routes/routes');
const requestRoutes = require('./modules/request/routes/routes');
const notificationRoutes = require('./modules/notification/routes/routes');
const bloodbankRoutes = require('./modules/bloodbank/routes/index');
const adminRoutes = require('./modules/admin/routes/admin');
const chatRoutes = require('./modules/chat/routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bloodbank', bloodbankRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Users Routes
const userRoutes = require('./modules/users/routes/users');
app.use('/api/users', userRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// Serve Manifests and Static Assets
// We explicitly serve manifest.json if it exists at the root of public
// This is redundant with express.static but harmless.
// The critical part is express.static serving the 'public' folder.
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for SPA (must be LAST)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

module.exports = app;
