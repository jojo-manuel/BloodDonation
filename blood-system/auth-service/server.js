require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// ==========================================
// MIDDLEWARE
// ==========================================

// app.use(cors()); // CORS handled by Gateway
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// DATABASE CONNECTION
// ==========================================

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('✅ Connected to MongoDB');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    });

// ==========================================
// HEALTH CHECK
// ==========================================

// Debug Logging
app.use((req, res, next) => {
    console.log(`🔍 [AuthService] Incoming Request: ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Auth Service',
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

app.get('/ping', (req, res) => res.send('pong'));

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', require('./routes/activities'));

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Auth Service running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'NOT CONFIGURED'}`);
});

module.exports = app;
