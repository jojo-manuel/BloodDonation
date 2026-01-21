const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const token = authHeader.substring(7);
        console.log('[DEBUG] VerifyToken - Header:', authHeader);
        console.log('[DEBUG] VerifyToken - Token (first 20):', token.substring(0, 20));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            user_id: decoded.user_id,
            role: decoded.role,
            hospital_id: decoded.hospital_id,
            email: decoded.email
        };
        next();
    } catch (error) {
        console.error('[DEBUG] VerifyToken Error:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;
