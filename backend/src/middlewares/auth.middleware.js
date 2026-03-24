const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT token
 */
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }

    // Keep lastActive fresh without blocking the request path.
    User.findByIdAndUpdate(user._id, { lastActive: new Date() }).catch((error) => {
      logger.warn('Failed to update user lastActive timestamp', { userId: user._id, error: error.message });
    });

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, 'Invalid token');
  }
});

/**
 * Restrict access to specific user types
 */
exports.restrictTo = (...userTypes) => {
  const allowedUserTypes = new Set(userTypes);

  return (req, res, next) => {
    if (!allowedUserTypes.has(req.user.userType)) {
      throw new ApiError(
        403,
        `User type ${req.user.userType} is not allowed to access this route`
      );
    }
    next();
  };
};

/**
 * Check if user owns the resource
 */
exports.checkOwnership = (resourceIdParam = 'id') => {
  return asyncHandler(async (req, res, next) => {
    const resourceId = req.params[resourceIdParam];

    if (resourceId === req.user.id.toString()) {
      return next();
    }

    throw new ApiError(
      403,
      'You do not have permission to access this resource'
    );
  });
};
