const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createReviewSchema } = require('../validators/review.validator');

router.post(
  '/',
  protect,
  restrictTo('user'),
  validate(createReviewSchema),
  reviewController.createReview
);

router.get(
  '/therapist/:therapistId',
  reviewController.getTherapistReviews
);

router.get(
  '/session/:sessionId',
  protect,
  reviewController.getSessionReview
);

router.get(
  '/user/:userId',
  protect,
  reviewController.getUserReviews
);

module.exports = router;
