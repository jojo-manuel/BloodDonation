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
    res.json({ message: 'BloodBank Backend API', status: 'running', service: 'bloodbank' });
});

// Routes - BloodBank service needs all blood bank related modules
const authRoutes = require('./modules/auth/routes/auth');
const bloodbankRoutes = require('./modules/bloodbank/routes/index');
const inventoryRoutes = require('./modules/inventory/routes/routes');
const donorRoutes = require('./modules/donor/routes/routes');
const requestRoutes = require('./modules/request/routes/routes');
const notificationRoutes = require('./modules/notification/routes/routes');
const userRoutes = require('./modules/users/routes/users');
const chatRoutes = require('./modules/chat/routes/chat');

app.use('/api/auth', authRoutes);
app.use('/api/bloodbank', bloodbankRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// New Routes
const patientRoutes = require('./modules/patient/routes/routes');
const reviewRoutes = require('./modules/review/routes/routes');

app.use('/api/patients', patientRoutes);
app.use('/api/reviews', reviewRoutes);

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

// 404 for unhandled routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found on BloodBank Backend (5004)' });
});

module.exports = app;
