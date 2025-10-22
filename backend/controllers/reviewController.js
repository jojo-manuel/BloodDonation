// controllers/reviewController.js
// Review management for donor reviews

const Review = require('../Models/Review');
const Donor = require('../Models/donor');
const DonationRequest = require('../Models/DonationRequest');
const asyncHandler = require('../Middleware/asyncHandler');

/**
 * Create a new review for a donor or blood bank
 * Body: type, donorId/bloodBankId, rating, comment
 */
exports.createReview = asyncHandler(async (req, res) => {
  const { type, donorId, bloodBankId, rating, comment } = req.body;

  // Validate type
  if (!type || !['donor', 'bloodbank'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Type must be either "donor" or "bloodbank"' });
  }

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  // Validate comment
  if (!comment || comment.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Comment is required' });
  }

  let entityId, entityModel, entityName;
  if (type === 'donor') {
    entityId = donorId;
    entityModel = Donor;
    entityName = 'Donor';
  } else {
    entityId = bloodBankId;
    entityModel = require('../Models/BloodBank');
    entityName = 'Blood Bank';
  }

  // Check if entity exists
  const entity = await entityModel.findById(entityId);
  if (!entity) {
    return res.status(404).json({ success: false, message: `${entityName} not found` });
  }

  // Check if user has interacted with this entity (has a completed request)
  let hasInteraction;
  if (type === 'donor') {
    hasInteraction = await DonationRequest.findOne({
      $or: [
        { requesterId: req.user.id, donorId: entityId, status: { $in: ['accepted', 'booked'] } },
        { receiverId: req.user.id, donorId: entityId, status: { $in: ['accepted', 'booked'] } }
      ]
    });
  } else {
    // For blood banks, check if user has had bookings or requests through this blood bank
    hasInteraction = await DonationRequest.findOne({
      $or: [
        { requesterId: req.user.id, bloodBankId: entityId, status: { $in: ['accepted', 'booked'] } },
        { receiverId: req.user.id, bloodBankId: entityId, status: { $in: ['accepted', 'booked'] } }
      ]
    });
  }

  if (!hasInteraction) {
    return res.status(403).json({
      success: false,
      message: `You can only review ${type === 'donor' ? 'donors' : 'blood banks'} you have interacted with through completed donation requests`
    });
  }

  // Check if user already reviewed this entity
  const existingReview = await Review.findOne({
    reviewerId: req.user.id,
    type: type,
    ...(type === 'donor' ? { donorId: entityId } : { bloodBankId: entityId })
  });

  if (existingReview) {
    return res.status(400).json({ success: false, message: `You have already reviewed this ${type === 'donor' ? 'donor' : 'blood bank'}` });
  }

  // Create review
  const reviewData = {
    reviewerId: req.user.id,
    type: type,
    rating: rating,
    comment: comment.trim()
  };

  if (type === 'donor') {
    reviewData.donorId = entityId;
  } else {
    reviewData.bloodBankId = entityId;
  }

  const review = await Review.create(reviewData);

  // Populate reviewer info
  await review.populate('reviewerId', 'username name');

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

/**
 * Get reviews for a specific donor
 * Params: donorId
 * Query: page, limit
 */
exports.getDonorReviews = asyncHandler(async (req, res) => {
  const { donorId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const maxLimit = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * maxLimit;

  // Check if donor exists
  const donor = await Donor.findById(donorId);
  if (!donor) {
    return res.status(404).json({ success: false, message: 'Donor not found' });
  }

  const [reviews, total] = await Promise.all([
    Review.find({ donorId: donorId, isActive: true })
      .populate('reviewerId', 'username name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit),
    Review.countDocuments({ donorId: donorId, isActive: true })
  ]);

  const pages = Math.ceil(total / maxLimit);

  // Calculate average rating
  const ratingStats = await Review.aggregate([
    { $match: { donorId: donor._id, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

  res.json({
    success: true,
    message: 'Reviews retrieved successfully',
    data: {
      reviews,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: stats.totalReviews
      },
      pagination: {
        page: Number(page),
        total,
        pages
      }
    }
  });
});

/**
 * Get reviews for a specific blood bank
 * Params: bloodBankId
 * Query: page, limit
 */
exports.getBloodBankReviews = asyncHandler(async (req, res) => {
  const { bloodBankId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const maxLimit = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * maxLimit;

  // Check if blood bank exists
  const bloodBank = await require('../Models/BloodBank').findById(bloodBankId);
  if (!bloodBank) {
    return res.status(404).json({ success: false, message: 'Blood Bank not found' });
  }

  const [reviews, total] = await Promise.all([
    Review.find({ bloodBankId: bloodBankId, isActive: true })
      .populate('reviewerId', 'username name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit),
    Review.countDocuments({ bloodBankId: bloodBankId, isActive: true })
  ]);

  const pages = Math.ceil(total / maxLimit);

  // Calculate average rating
  const ratingStats = await Review.aggregate([
    { $match: { bloodBankId: bloodBank._id, isActive: true } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

  res.json({
    success: true,
    message: 'Reviews retrieved successfully',
    data: {
      reviews,
      stats: {
        bloodBankName: bloodBank.name,
        averageRating: Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: stats.totalReviews
      },
      pagination: {
        page: Number(page),
        total,
        pages
      }
    }
  });
});

/**
 * Get reviews by the authenticated user
 * Query: page, limit
 */
exports.getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const maxLimit = Math.min(Number(limit) || 10, 50);
  const skip = (Number(page) - 1) * maxLimit;

  const [reviews, total] = await Promise.all([
    Review.find({ reviewerId: req.user.id, isActive: true })
      .populate({
        path: 'donorId',
        select: 'userId bloodGroup houseAddress',
        populate: { path: 'userId', select: 'username' }
      })
      .populate({
        path: 'bloodBankId',
        select: 'name address district'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(maxLimit),
    Review.countDocuments({ reviewerId: req.user.id, isActive: true })
  ]);

  const pages = Math.ceil(total / maxLimit);

  res.json({
    success: true,
    message: 'Your reviews retrieved successfully',
    data: {
      reviews,
      pagination: {
        page: Number(page),
        total,
        pages
      }
    }
  });
});

/**
 * Update a review (only by the reviewer)
 * Params: reviewId
 * Body: rating, comment
 */
exports.updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;

  // Validate rating if provided
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  // Validate comment if provided
  if (comment !== undefined && comment.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
  }

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  // Check if user owns this review
  if (review.reviewerId.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only update your own reviews' });
  }

  // Update fields
  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment.trim();

  await review.save();

  // Populate reviewer info
  await review.populate('reviewerId', 'username name');

  res.json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

/**
 * Delete a review (soft delete by setting isActive to false)
 * Params: reviewId
 */
exports.deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  // Check if user owns this review
  if (review.reviewerId.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only delete your own reviews' });
  }

  review.isActive = false;
  await review.save();

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

/**
 * Get donors that user can review (those they've sent requests to and completed)
 */
exports.getReviewableDonors = asyncHandler(async (req, res) => {
  // Find completed donation requests where user sent the request
  const completedRequests = await DonationRequest.find({
    requesterId: req.user.id,
    status: { $in: ['accepted', 'booked'] }
  }).populate('donorId', 'userId bloodGroup houseAddress')
    .populate('donorId.userId', 'username');

  // Extract unique donors
  const donorMap = new Map();
  completedRequests.forEach(request => {
    if (request.donorId && !donorMap.has(request.donorId._id.toString())) {
      donorMap.set(request.donorId._id.toString(), request.donorId);
    }
  });

  const donors = Array.from(donorMap.values());

  // Get existing reviews by this user
  const existingReviews = await Review.find({
    reviewerId: req.user.id,
    donorId: { $in: donors.map(d => d._id) }
  }).select('donorId');

  const reviewedDonorIds = new Set(existingReviews.map(r => r.donorId.toString()));

  // Filter out already reviewed donors
  const reviewableDonors = donors.filter(donor => !reviewedDonorIds.has(donor._id.toString()));

  res.json({
    success: true,
    message: 'Reviewable donors retrieved successfully',
    data: reviewableDonors
  });
});

/**
 * Get blood banks that user can review (those they've interacted with)
 */
exports.getReviewableBloodBanks = asyncHandler(async (req, res) => {
  // Find completed donation requests where user was involved
  const completedRequests = await DonationRequest.find({
    $or: [
      { requesterId: req.user.id, status: { $in: ['accepted', 'booked'] } },
      { receiverId: req.user.id, status: { $in: ['accepted', 'booked'] } }
    ]
  }).populate('bloodBankId', 'name address district');

  // Extract unique blood banks
  const bloodBankMap = new Map();
  completedRequests.forEach(request => {
    if (request.bloodBankId && !bloodBankMap.has(request.bloodBankId._id.toString())) {
      bloodBankMap.set(request.bloodBankId._id.toString(), request.bloodBankId);
    }
  });

  const bloodBanks = Array.from(bloodBankMap.values());

  // Get existing reviews by this user
  const existingReviews = await Review.find({
    reviewerId: req.user.id,
    bloodBankId: { $in: bloodBanks.map(bb => bb._id) }
  }).select('bloodBankId');

  const reviewedBloodBankIds = new Set(existingReviews.map(r => r.bloodBankId.toString()));

  // Filter out already reviewed blood banks
  const reviewableBloodBanks = bloodBanks.filter(bloodBank => !reviewedBloodBankIds.has(bloodBank._id.toString()));

  res.json({
    success: true,
    message: 'Reviewable blood banks retrieved successfully',
    data: reviewableBloodBanks
  });
});
