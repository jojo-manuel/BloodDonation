/**
 * RBAC Middleware - Role-Based Access Control
 * Enforces permissions based on user roles
 */

const ROLES = {
    DONOR: 'DONOR',
    DOCTOR: 'DOCTOR',
    BLOODBANK_ADMIN: 'BLOODBANK_ADMIN'
};

/**
 * Middleware factory to check if user has required role(s)
 * @param {Array|String} allowedRoles - Single role or array of allowed roles
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (should be set by verifyToken middleware)
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        // Convert single role to array for uniform handling
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Check if user's role is in allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

/**
 * Middleware to ensure hospital_id isolation
 * Validates that requests only access data from user's hospital
 */
const enforceHospitalIsolation = (req, res, next) => {
    const userHospitalId = req.user.hospital_id;

    // Check hospital_id in body, params, or query
    const requestHospitalId = req.body.hospital_id ||
        req.params.hospital_id ||
        req.query.hospital_id;

    // If hospital_id is provided in request, it must match user's hospital
    if (requestHospitalId && requestHospitalId !== userHospitalId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Cannot access other hospital data.'
        });
    }

    // Inject user's hospital_id into request for backend services
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.body.hospital_id = userHospitalId;
    }

    // Add to query params for GET requests
    if (req.method === 'GET') {
        req.query.hospital_id = userHospitalId;

        // Update URL to include the new query param so proxy forwards it
        const urlObj = new URL(req.url, 'http://dummy.com'); // Base needed for relative URLs
        urlObj.searchParams.set('hospital_id', userHospitalId);
        // req.url must be relative path + search
        req.url = urlObj.pathname + urlObj.search;
    }

    next();
};

module.exports = {
    ROLES,
    checkRole,
    enforceHospitalIsolation
};
