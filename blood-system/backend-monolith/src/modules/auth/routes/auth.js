const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(['DONOR', 'DOCTOR', 'BLOODBANK_ADMIN', 'admin', 'bloodbank', 'user']).withMessage('Invalid role'),
    body('hospital_id').trim().notEmpty().withMessage('Hospital ID is required')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const generateToken = (user) => {
    const payload = {
        user_id: user._id,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email, password, name, role, hospital_id } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'User already exists' });

        const user = new User({ email, password, name, role, hospital_id });
        await user.save();
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
    }
});

router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid email or password' });

        user.lastLogin = new Date();
        await user.save();
        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Login successful',
            data: { user: user.toJSON(), token }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed', error: error.message });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh Token Required' });
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user_id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const newToken = generateToken(user);
        res.json({ success: true, data: { accessToken: newToken, refreshToken: refreshToken } });
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid Refresh Token' });
    }
});

router.get('/verify', (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'No token' });
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ success: true, message: 'Token is valid', data: decoded });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
    }
});

module.exports = router;
