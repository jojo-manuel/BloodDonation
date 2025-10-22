// Route/reviewRoutes.js
// Review management routes

const express = require('express');
const authMiddleware = require('../Middleware/authMiddleware');
const {
  createReview,
  getDonorReviews,
  getBloodBankReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  getReviewableDonors,
  getReviewableBloodBanks
} = require('../controllers/reviewController');

const router = express.Router();

// Create a new review
router.post('/', authMiddleware, createReview);

// Get reviews for a specific donor (public)
router.get('/donor/:donorId', getDonorReviews);

// Get reviews for a specific blood bank (public)
router.get('/bloodbank/:bloodBankId', getBloodBankReviews);

// Get reviews by the authenticated user
router.get('/my', authMiddleware, getMyReviews);

// Get donors that the authenticated user can review
router.get('/reviewable-donors', authMiddleware, getReviewableDonors);

// Get blood banks that the authenticated user can review
router.get('/reviewable-bloodbanks', authMiddleware, getReviewableBloodBanks);

// Update a review
router.put('/:reviewId', authMiddleware, updateReview);

// Delete a review (soft delete)
router.delete('/:reviewId', authMiddleware, deleteReview);

module.exports = router;
