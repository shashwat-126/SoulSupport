const Joi = require('joi');

exports.createSessionSchema = Joi.object({
  therapistId: Joi.string().required(),
  sessionDate: Joi.date().min('now').required(),
  durationMinutes: Joi.number().valid(30, 60, 90).default(60),
  notes: Joi.string().max(2000).optional().allow(''),
});

exports.createSlotHoldSchema = Joi.object({
  therapistId: Joi.string().required(),
  sessionDate: Joi.date().min('now').required(),
  durationMinutes: Joi.number().valid(30, 60, 90).default(60),
});

exports.confirmSlotHoldSchema = Joi.object({
  notes: Joi.string().max(2000).optional().allow(''),
});

exports.updateSessionSchema = Joi.object({
  status: Joi.string().valid(
    'pending',
    'confirmed',
    'cancelled_by_user',
    'cancelled_by_therapist',
    'completed',
    'expired'
  ),
  notes: Joi.string().max(2000).allow(''),
  meetingLink: Joi.string().uri(),
  meetingRoomId: Joi.string(),
  meetingStatus: Joi.string().valid('scheduled', 'active', 'completed', 'cancelled'),
  cancelReason: Joi.string().max(500),
});

exports.updateSessionStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled_by_therapist').required(),
  cancelReason: Joi.when('status', {
    is: 'cancelled_by_therapist',
    then: Joi.string().trim().min(1).max(500).required(),
    otherwise: Joi.string().max(500).optional().allow(''),
  }),
});

exports.updateSessionDetailsSchema = Joi.object({
  sessionDate: Joi.date().min('now'),
  durationMinutes: Joi.number().valid(30, 60, 90),
  notes: Joi.string().max(2000).allow(''),
});

exports.updateCompletionStatusSchema = Joi.object({
  status: Joi.string().valid('completed', 'cancelled_by_user', 'cancelled_by_therapist').required(),
  cancellationReason: Joi.string().max(500).allow('', null),
});
