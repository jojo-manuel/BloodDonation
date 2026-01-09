const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');

// Pincode Proxy Route
router.get('/address/:pincode', donorController.getAddressByPincode);

// Donor Search Routes
router.get('/cities/available', donorController.getAvailableCities);
router.get('/search', donorController.searchDonors);
router.get('/searchByMrid/:mrid', donorController.searchDonorsByMrid);

// Placeholders for other routes utilized by Frontend
router.get('/me', (req, res) => res.status(404).json({ success: false, message: "Donor profile not found" }));
router.post('/register', (req, res) => res.json({ success: true, message: "Donor registered successfully" }));
router.put('/update', (req, res) => res.json({ success: true, message: "Donor updated successfully" }));
router.delete('/delete', (req, res) => res.json({ success: true, message: "Donor deleted successfully" }));

module.exports = router;
