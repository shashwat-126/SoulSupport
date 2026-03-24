const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, _next) => {
  void _next;
  let error = { ...err };
  error.message = err.message;

  // Avoid polluting dev logs with expected 4xx operational errors.
  if (process.env.NODE_ENV !== 'test') {
    const isOperationalClientError =
      Boolean(err.isOperational) &&
      Number(err.statusCode) >= 400 &&
      Number(err.statusCode) < 500;

    if (isOperationalClientError) {
      console.warn(`${req.method} ${req.originalUrl} -> ${err.statusCode} ${err.message}`);
    } else {
      console.error(err);
    }
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ApiError(404, message);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(400, message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new ApiError(400, message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
