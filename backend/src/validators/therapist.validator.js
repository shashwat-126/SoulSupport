const Joi = require('joi');

exports.updateTherapistProfileSchema = Joi.object({
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
  qualifications: Joi.string(),
  experienceYears: Joi.number().min(0),
  hourlyRate: Joi.number().min(0),
  sessionPricing: Joi.number().min(0),
  languages: Joi.array().items(Joi.string().max(40)),
  availability: Joi.object({
    days: Joi.array().items(
      Joi.string().valid(
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday'
      )
    ),
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
  bio: Joi.string().max(500),
});
