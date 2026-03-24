const express = require('express');
const router = express.Router();
const therapistController = require('../controllers/therapist.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../middlewares/upload.middleware');
const { listLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  updateTherapistProfileSchema,
} = require('../validators/therapist.validator');

router.get('/', listLimiter, therapistController.getTherapists);
router.get('/search', listLimiter, therapistController.getTherapists);

// Protected route - must come before :id route
router.get('/profile', protect, restrictTo('therapist'), therapistController.getMyProfile);
router.put(
  '/profile',
  protect,
  restrictTo('therapist'),
  validate(updateTherapistProfileSchema),
  therapistController.updateProfile
);

router.get('/:id', listLimiter, therapistController.getTherapist);

router.put(
  '/:id',
  protect,
  restrictTo('therapist'),
  validate(updateTherapistProfileSchema),
  therapistController.updateProfile
);

router.post(
  '/:id/photo',
  protect,
  restrictTo('therapist'),
  uploadSingle('photo'),
  therapistController.uploadPhoto
);

router.get('/:id/reviews', therapistController.getReviews);

router.get('/:id/availability', therapistController.checkAvailability);

module.exports = router;
