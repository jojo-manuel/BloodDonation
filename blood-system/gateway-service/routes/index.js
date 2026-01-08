const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const verifyToken = require('../middleware/auth');
const { checkRole, enforceHospitalIsolation, ROLES } = require('../middleware/rbac');

const router = express.Router();

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

const injectUserHeaders = (proxyReq, req) => {
    if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.user_id);
        proxyReq.setHeader('X-User-Role', req.user.role);
        proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);
    }
};

// Auth routes - proxied without authentication
router.use('/auth', createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '' // Remove /api/auth prefix
    },
    onProxyReq: (proxyReq, req) => {
        if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
            const bodyData = JSON.stringify(req.body);
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
        }
    }
}));

// Users routes - authenticated
router.use(verifyToken); // Apply auth check before accessing /users
router.use('/users',
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/users': '/users' },
        onProxyReq: injectUserHeaders
    })
);

// ==========================================
// PROTECTED ROUTES (Authentication required)
// ==========================================

// All routes below require authentication
router.use(verifyToken);
router.use(enforceHospitalIsolation);

// ==========================================
// ADMIN ROUTES
// ==========================================

router.use('/admin/donors',
    checkRole([ROLES.BLOODBANK_ADMIN, 'admin']),
    createProxyMiddleware({
        target: process.env.DONOR_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/donors': '/donors' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/users',
    checkRole(['admin']),
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/users': '/users' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/admins',
    checkRole(['admin']),
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/admins': '/admins' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/bloodbanks',
    checkRole(['admin']),
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/bloodbanks': '/bloodbanks' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/patients',
    checkRole(['admin', ROLES.BLOODBANK_ADMIN]),
    createProxyMiddleware({
        target: process.env.DONOR_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/patients': '/patients' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/donation-requests',
    checkRole(['admin', ROLES.BLOODBANK_ADMIN]),
    createProxyMiddleware({
        target: process.env.REQUEST_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/donation-requests': '/requests' },
        onProxyReq: injectUserHeaders
    })
);

router.use('/admin/activities',
    checkRole(['admin']),
    createProxyMiddleware({
        target: process.env.AUTH_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api/admin/activities': '/activities' },
        onProxyReq: injectUserHeaders
    })
);

// ==========================================
// DONOR SERVICE ROUTES
// ==========================================

// Public/Shared Donor Routes (Available Cities)
router.use('/donors/cities/available',
    createProxyMiddleware({
        target: process.env.DONOR_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/donors/cities/available': '/donors/cities/available'
        },
        onProxyReq: injectUserHeaders
    })
);

// Admin only - Manage donors (Catch-all for other /donors routes)
// CHANGED: Removed checkRole(ROLES.BLOODBANK_ADMIN) to allow /me and /address/* for all authenticated users
router.use('/donors',
    createProxyMiddleware({
        target: process.env.DONOR_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/donors': '/donors'
        },
        onProxyReq: (proxyReq, req) => {
            // Forward user context to backend service
            proxyReq.setHeader('X-User-Id', req.user.user_id);
            proxyReq.setHeader('X-User-Role', req.user.role);
            proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);

            // Re-stream body for POST/PUT requests
            if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    })
);

// Mock Chat Service (Temporary Fix)
router.use('/chat', (req, res) => {
    // console.log('⚠️ Mocking Chat Service response for:', req.url);
    if (req.url.includes('unread-count')) {
        return res.json({ success: true, data: { unreadCount: 0 } });
    }
    res.json({ success: true, data: [] });
});

// ==========================================
// INVENTORY SERVICE ROUTES
// ==========================================

// Admin can manage, Doctor can view
router.use('/inventory',
    checkRole([ROLES.BLOODBANK_ADMIN, ROLES.DOCTOR]),
    createProxyMiddleware({
        target: process.env.INVENTORY_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/inventory': '/inventory'
        },
        onProxyReq: (proxyReq, req) => {
            proxyReq.setHeader('X-User-Id', req.user.user_id);
            proxyReq.setHeader('X-User-Role', req.user.role);
            proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);

            if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    })
);

// ==========================================
// REQUEST SERVICE ROUTES
// ==========================================

// All authenticated users can create/view requests
router.use('/requests',
    checkRole([ROLES.DONOR, ROLES.DOCTOR, ROLES.BLOODBANK_ADMIN]),
    createProxyMiddleware({
        target: process.env.REQUEST_SERVICE_URL,
        changeOrigin: true,
        pathRewrite: {
            '^/api/requests': '/requests'
        },
        onProxyReq: (proxyReq, req) => {
            proxyReq.setHeader('X-User-Id', req.user.user_id);
            proxyReq.setHeader('X-User-Role', req.user.role);
            proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);

            if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        }
    })
);

// ==========================================
// OPTIONAL SERVICE ROUTES
// ==========================================

// Notification Service - Authenticated Users (Donors, Doctors, Admins)
if (process.env.NOTIFICATION_SERVICE_URL) {
    router.use('/notifications',
        // Removed strict BLOODBANK_ADMIN check to allow Donors to read their notifications
        // checkRole(ROLES.BLOODBANK_ADMIN) -> Allow all authenticated
        createProxyMiddleware({
            target: process.env.NOTIFICATION_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/api/notifications': '/notifications'
            },
            onProxyReq: (proxyReq, req) => {
                proxyReq.setHeader('X-User-Id', req.user.user_id);
                proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);
                // ... (rest of configuration)
            }
        })
    );
}

// IoT Service - Admin only
if (process.env.IOT_SERVICE_URL) {
    router.use('/iot',
        checkRole(ROLES.BLOODBANK_ADMIN),
        createProxyMiddleware({
            target: process.env.IOT_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/api/iot': '/sensors'
            },
            onProxyReq: (proxyReq, req) => {
                proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);

                if (req.body && req.method === 'POST') {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            }
        })
    );
}

// Ledger Service - Admin only
if (process.env.LEDGER_SERVICE_URL) {
    router.use('/ledger',
        checkRole(ROLES.BLOODBANK_ADMIN),
        createProxyMiddleware({
            target: process.env.LEDGER_SERVICE_URL,
            changeOrigin: true,
            pathRewrite: {
                '^/api/ledger': '/ledger'
            },
            onProxyReq: (proxyReq, req) => {
                proxyReq.setHeader('X-Hospital-Id', req.user.hospital_id);

                if (req.body && req.method === 'POST') {
                    const bodyData = JSON.stringify(req.body);
                    proxyReq.setHeader('Content-Type', 'application/json');
                    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                    proxyReq.write(bodyData);
                }
            }
        })
    );
}

// ==========================================
// MOCK SERVICES (For missing features)
// ==========================================

// Reviews (Stubbed to prevent 404s)
router.use('/reviews', (req, res) => {
    console.log('⚠️ Mocking Review Service response for:', req.url);
    res.json({ success: true, data: [] });
});

module.exports = router;
