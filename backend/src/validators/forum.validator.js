const Joi = require('joi');

// Single source of truth for allowed categories
const categories = [
  'general',
  'anxiety',
  'depression',
  'relationships',
  'stress',
  'success',
];

exports.createPostSchema = Joi.object({
  content: Joi.string().min(10).max(5000).required(),
  category: Joi.string().valid(...categories).required(),
  isAnonymous: Joi.boolean().default(true),
});

exports.createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  isAnonymous: Joi.boolean().default(true),
});

exports.categories = categories;
