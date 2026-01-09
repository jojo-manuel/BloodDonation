const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');

const { authenticate } = require('../../../middleware/authMiddleware');

// Pincode Proxy Route
router.get('/address/:pincode', donorController.getAddressByPincode);

// Donor Search Routes
router.get('/cities/available', donorController.getAvailableCities);
router.get('/search', donorController.searchDonors);
router.get('/searchByMrid/:mrid', donorController.searchDonorsByMrid);

// Protected Routes
router.get('/me', authenticate, donorController.getProfile);
router.post('/register', authenticate, donorController.createProfile);
router.put('/update', authenticate, donorController.updateProfile);
router.delete('/delete', authenticate, donorController.deleteProfile);

module.exports = router;
