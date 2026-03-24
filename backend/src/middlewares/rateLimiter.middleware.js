const rateLimit = require('express-rate-limit');
const {
  RATE_WINDOW_AUTH_MS,
  RATE_WINDOW_API_MS,
  RATE_WINDOW_POST_MS,
  RATE_WINDOW_LIST_MS,
} = require('../config/constants');

// General API limiter
exports.apiLimiter = rateLimit({
  windowMs: RATE_WINDOW_API_MS,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter (stricter)
exports.authLimiter = rateLimit({
  windowMs: RATE_WINDOW_AUTH_MS,
  max: 5,
  message: 'Too many login attempts, please try again later',
  skipSuccessfulRequests: true,
});

// Post creation limiter
exports.postLimiter = rateLimit({
  windowMs: RATE_WINDOW_POST_MS,
  max: 10,
  message: 'Too many posts created, please try again later',
});

// Public listing endpoints — prevent bulk scraping
exports.listLimiter = rateLimit({
  windowMs: RATE_WINDOW_LIST_MS,
  max: 60,
  message: 'Too many listing requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});
