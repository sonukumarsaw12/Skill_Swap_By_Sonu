const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { revieweeId, rating, comment } = req.body;

        // Check if users match (cannot rate self)
        if (revieweeId === req.user.id) {
            return res.status(400).json({ message: 'Cannot rate yourself' });
        }

        const review = await Review.create({
            reviewer: req.user.id,
            reviewee: revieweeId,
            rating,
            comment
        });

        // Update user's average rating
        const reviews = await Review.find({ reviewee: revieweeId });
        const avgRating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

        await User.findByIdAndUpdate(revieweeId, { rating: avgRating });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/:userId
// @access  Private
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'name');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addReview, getReviews };
