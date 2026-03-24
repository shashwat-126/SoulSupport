const Review = require('../models/Review.model');
const Session = require('../models/Session.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');
const ratingService = require('../services/rating.service');

/**
 * @desc    Create a review
 * @route   POST /api/reviews
 * @access  Private (User only)
 */
exports.createReview = asyncHandler(async (req, res) => {
  const { sessionId, rating, reviewTitle, comment, reviewText } = req.body;

  // Check if session exists and is completed
  const session = await Session.findById(sessionId);

  if (!session) {
    throw new ApiError(404, 'Session not found');
  }

  if (session.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'You can only review your own sessions');
  }

  if (session.status !== 'completed') {
    throw new ApiError(400, 'Can only review completed sessions');
  }

  if (
    session.sessionStatusUser !== 'completed' ||
    session.sessionStatusTherapist !== 'completed'
  ) {
    throw new ApiError(400, 'Review allowed only if session is fully completed');
  }

  // Check if review already exists
  const existingReview = await Review.findOne({ sessionId });
  if (existingReview) {
    throw new ApiError(400, 'Review already exists for this session');
  }

  // Get user info
  const user = await User.findById(req.user.id);

  // Create review
  const review = await Review.create({
    sessionId,
    therapistId: session.therapistId,
    userId: req.user.id,
    reviewer: {
      name: user.fullName,
      avatarUrl: user.avatarUrl,
    },
    rating,
    reviewTitle,
    comment: comment || reviewText,
    reviewText: reviewText || comment,
  });

  // Update therapist rating
  await ratingService.updateTherapistRating(session.therapistId);

  // Notify therapist
  await notificationService.notifyNewReview(
    session.therapistId,
    req.user.id,
    review._id,
    rating
  );

  res
    .status(201)
    .json(new ApiResponse(201, { review }, 'Review created successfully'));
});

/**
 * @desc    Get therapist reviews
 * @route   GET /api/reviews/therapist/:therapistId
 * @access  Public
 */
exports.getTherapistReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ therapistId: req.params.therapistId, isVisible: true })
    .sort({ createdAt: -1 })
    .limit(Number.parseInt(limit, 10))
    .skip(skip);

  const total = await Review.countDocuments({
    therapistId: req.params.therapistId,
    isVisible: true,
  });

  res.json(
    new ApiResponse(
      200,
      {
        reviews,
        pagination: {
          page: Number.parseInt(page, 10),
          limit: Number.parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Reviews retrieved successfully'
    )
  );
});

/**
 * @desc    Get review for a session
 * @route   GET /api/reviews/session/:sessionId
 * @access  Private (owner or therapist)
 */
exports.getSessionReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ sessionId: req.params.sessionId });
  if (!review) throw new ApiError(404, 'Review not found');

  const session = await Session.findById(review.sessionId);
  if (
    session.userId.toString() !== req.user.id.toString() &&
    session.therapistId.toString() !== req.user.id.toString()
  ) {
    throw new ApiError(403, 'Not authorized to view this review');
  }

  res.json(new ApiResponse(200, { review }, 'Review retrieved successfully'));
});

/**
 * @desc    Get reviews by user
 * @route   GET /api/reviews/user/:userId
 * @access  Private (owner)
 */
exports.getUserReviews = asyncHandler(async (req, res) => {
  if (req.params.userId !== req.user.id.toString()) {
    throw new ApiError(403, 'You can only view your own reviews');
  }

  const reviews = await Review.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, { reviews }, 'User reviews retrieved successfully'));
});
