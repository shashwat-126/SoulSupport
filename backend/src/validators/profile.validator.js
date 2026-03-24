const Joi = require('joi');

const daySchema = Joi.string().valid(
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
);

exports.updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(120),
  username: Joi.string().pattern(/^[a-z0-9_.-]{3,30}$/),
  bio: Joi.string().max(500).allow(''),
  location: Joi.string().max(120).allow(''),
  mentalHealthGoals: Joi.array().items(Joi.string().max(120)),
  preferredTherapyTypes: Joi.array().items(Joi.string().max(80)),
  specializations: Joi.array().items(
    Joi.string().valid(
      'anxiety',
      'depression',
      'relationships',
      'stress',
      'trauma',
      'addiction',
      'grief',
      'self-esteem',
      'career',
      'family'
    )
  ),
  qualifications: Joi.string().allow(''),
  experienceYears: Joi.number().min(0),
  languages: Joi.array().items(Joi.string().max(40)),
  sessionPricing: Joi.number().min(0),
  hourlyRate: Joi.number().min(0),
  availability: Joi.object({
    days: Joi.array().items(daySchema),
    timeStart: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    timeEnd: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  }),
  weeklyAvailability: Joi.object({
    monday: Joi.array().items(Joi.string()),
    tuesday: Joi.array().items(Joi.string()),
    wednesday: Joi.array().items(Joi.string()),
    thursday: Joi.array().items(Joi.string()),
    friday: Joi.array().items(Joi.string()),
    saturday: Joi.array().items(Joi.string()),
    sunday: Joi.array().items(Joi.string()),
  }),
});
