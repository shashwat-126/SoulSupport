const Joi = require('joi');

exports.createReviewSchema = Joi.object({
  sessionId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  reviewTitle: Joi.string().max(120).allow('', null),
  comment: Joi.string().max(1000).allow('', null),
  reviewText: Joi.string().max(1000).allow('', null),
});
