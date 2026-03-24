const ApiError = require('../utils/ApiError');

/**
 * Validate request using Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      throw new ApiError(400, errorMessage);
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
