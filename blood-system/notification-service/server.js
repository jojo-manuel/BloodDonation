require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3005;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'Notification Service',
        timestamp: new Date().toISOString(),
        smtp_configured: !!process.env.SMTP_USER
    });
});

// ==========================================
// ROUTES
// ==========================================

app.use('/notifications', notificationRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

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

// ==========================================
// DATABASE CONNECTION
// ==========================================

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`🚀 Notification Service running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📧 SMTP: ${process.env.SMTP_USER ? 'Configured' : 'NOT CONFIGURED'}`);
});

module.exports = app;
