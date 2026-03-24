const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { protect, restrictTo } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  createSessionSchema,
  createSlotHoldSchema,
  confirmSlotHoldSchema,
  updateSessionStatusSchema,
  updateSessionDetailsSchema,
  updateCompletionStatusSchema,
} = require('../validators/session.validator');
const { sanitizeFields } = require('../middlewares/sanitize.middleware');

router.get('/', protect, sessionController.getSessions);
router.get('/upcoming', protect, sessionController.getUpcoming);
router.get('/available-slots/:therapistId', sessionController.getAvailableSlots);
router.get('/stream', sessionController.streamSessionEvents);

router.post(
  '/holds',
  protect,
  restrictTo('user'),
  validate(createSlotHoldSchema),
  sessionController.createSlotHold
);

router.post(
  '/holds/:holdId/confirm',
  protect,
  restrictTo('user'),
  validate(confirmSlotHoldSchema),
  sessionController.confirmSlotHold
);

router.post(
  '/',
  protect,
  restrictTo('user'),
  validate(createSessionSchema),
  sanitizeFields('notes'),
  sessionController.createSession
);

router.get('/:id', protect, sessionController.getSession);

router.put(
  '/:id',
  protect,
  validate(updateSessionDetailsSchema),
  sanitizeFields('notes'),
  sessionController.updateSession
);

router.put(
  '/:id/status',
  protect,
  restrictTo('therapist'),
  validate(updateSessionStatusSchema),
  sessionController.updateSessionStatus
);

router.get('/:id/meeting', protect, sessionController.getMeetingAccess);

router.put(
  '/:id/completion-status',
  protect,
  validate(updateCompletionStatusSchema),
  sessionController.updateCompletionStatus
);

router.delete('/:id', protect, sessionController.cancelSession);

module.exports = router;
