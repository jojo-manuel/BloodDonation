// Route/donorRoutes.js
// Public donor search and private donor profile management.

const express = require('express');
const authMiddleware = require('../Middleware/authMiddleware');
const validate = require('../Middleware/validate');
const { donorRegisterBody } = require('../validators/schemas');
const { registerOrUpdateDonor, updateDonor, deleteDonor, searchDonors, getOne, getMe, searchDonorsByMrid, respondToRequest, getAddressByPostalCode, getAvailableCities } = require('../controllers/donorController');
const donationRequestController = require('../controllers/donationRequestController');

const router = express.Router();

// Create or update the authenticated user's donor profile
router.post('/register', authMiddleware, validate({ body: donorRegisterBody }), registerOrUpdateDonor);

// Update the authenticated user's donor profile
router.put('/update', authMiddleware, validate({ body: donorRegisterBody }), updateDonor);

// Delete the authenticated user's donor profile
router.delete('/delete', authMiddleware, deleteDonor);

// Get the authenticated user's donor profile
router.get('/me', authMiddleware, getMe);

// Get address details by postal code
router.get('/address/:postalCode', getAddressByPostalCode);

// Get unique cities where donors are available
router.get('/cities/available', getAvailableCities);

// Public donor search with filters
router.get('/search', searchDonors);

// New route: search donors by MR number (public)
router.get('/searchByMrid/:mrid', searchDonorsByMrid);

// Get a single donor by id
router.get('/:id', getOne);

// Respond to a donation request (accept or reject)
router.put('/requests/:requestId/respond', authMiddleware, respondToRequest);

// Slot booking feature removed

// Create a donation request to a donor (sender is current user)
router.post('/:donorId/requests', authMiddleware, donationRequestController.createRequest);

// List requests received by current user (as receiver/donor)
router.get('/requests', authMiddleware, donationRequestController.listReceived);

// List requests sent by current user (as sender)
router.get('/requests/sent', authMiddleware, donationRequestController.listSent);

// Update status of a donation request
router.put('/requests/:id/status', authMiddleware, donationRequestController.updateStatus);

// List all donation requests (admin view)
router.get('/requests/all', authMiddleware, donationRequestController.listAll);

module.exports = router;
