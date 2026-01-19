const ROLES = {
    DONOR: 'DONOR',
    DOCTOR: 'DOCTOR',
    BLOODBANK_ADMIN: 'BLOODBANK_ADMIN'
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` });
        }
        next();
    };
};

const enforceHospitalIsolation = (req, res, next) => {
    const userHospitalId = req.user.hospital_id;
    const requestHospitalId = req.body.hospital_id || req.params.hospital_id || req.query.hospital_id;

    if (requestHospitalId && requestHospitalId !== userHospitalId) {
        return res.status(403).json({ success: false, message: 'Access denied. Cannot access other hospital data.' });
    }

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        req.body.hospital_id = userHospitalId;
    }
    if (req.method === 'GET') {
        req.query.hospital_id = userHospitalId;
    }
    next();
};

module.exports = { ROLES, checkRole, enforceHospitalIsolation };
