const Joi = require('joi');

const types = ['guide', 'video', 'podcast', 'article'];
const categories = ['anxiety', 'depression', 'stress', 'relationships', 'general'];

exports.createResourceSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().min(10).max(4000).required(),
  type: Joi.string().valid(...types).required(),
  category: Joi.string().valid(...categories).required(),
  url: Joi.string().uri().required(),
  thumbnailUrl: Joi.string().uri().optional(),
  author: Joi.string().max(200).optional(),
  duration: Joi.string().max(50).optional(),
  tags: Joi.array().items(Joi.string().max(50)).default([]),
  isPublished: Joi.boolean().default(true),
});

exports.updateResourceSchema = exports.createResourceSchema.fork(
  ['title', 'description', 'type', 'category', 'url'],
  (schema) => schema.optional()
);

exports.types = types;
exports.categories = categories;
