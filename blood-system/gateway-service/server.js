require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS
// CORS
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Id', 'X-User-Role', 'X-Hospital-Id']
}));

// Request logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'API Gateway',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ==========================================
// API ROUTES
// ==========================================

app.use('/api', routes);

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
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'NOT CONFIGURED'}`);
    console.log('\n📍 Service URLs:');
    console.log(`   Auth:         ${process.env.AUTH_SERVICE_URL}`);
    console.log(`   Donor:        ${process.env.DONOR_SERVICE_URL}`);
    console.log(`   Inventory:    ${process.env.INVENTORY_SERVICE_URL}`);
    console.log(`   Request:      ${process.env.REQUEST_SERVICE_URL}`);

    if (process.env.NOTIFICATION_SERVICE_URL) {
        console.log(`   Notification: ${process.env.NOTIFICATION_SERVICE_URL}`);
    }
    if (process.env.IOT_SERVICE_URL) {
        console.log(`   IoT:          ${process.env.IOT_SERVICE_URL}`);
    }
    if (process.env.LEDGER_SERVICE_URL) {
        console.log(`   Ledger:       ${process.env.LEDGER_SERVICE_URL}`);
    }
});

module.exports = app;
