const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const verifyToken = require('../../../middleware/auth');

// GET /api/reviews/bloodbank/:id
router.get('/bloodbank/:id', verifyToken, async (req, res) => {
    try {
        const bloodBankId = req.params.id;

        const reviews = await Review.find({ bloodBankId: bloodBankId })
            .populate('reviewerId', 'name')
            .sort({ createdAt: -1 });

        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
            ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews
            : 0;

        res.json({
            success: true,
            data: {
                reviews,
                stats: {
                    averageRating: parseFloat(averageRating.toFixed(1)),
                    totalReviews
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/reviews/:id
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

        // Authorization check
        if (review.bloodBankId.toString() !== req.user.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this review' });
        }

        await review.deleteOne();
        res.json({ success: true, message: 'Review deleted' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/reviews - Create review
router.post('/', verifyToken, async (req, res) => {
    try {
        const { bloodBankId, rating, comment } = req.body;
        const reviewerId = req.user.user_id;

        const review = new Review({
            bloodBankId,
            reviewerId,
            rating,
            comment
        });

        await review.save();
        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
