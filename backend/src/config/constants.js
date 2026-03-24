// Centralised magic-number constants for the entire backend.
// Import from here instead of using inline numeric literals.

module.exports = {
  // Token / expiry durations (ms)
  EMAIL_VERIFICATION_TTL_MS: 24 * 60 * 60 * 1000, // 24 h
  PASSWORD_RESET_TTL_MS: 60 * 60 * 1000,            // 1 h
  JWT_EXPIRES_IN: '7d',

  // Session / slot holds
  DEFAULT_SLOT_HOLD_MINUTES: 10,
  SESSION_DURATION_OPTIONS: [30, 60, 90],

  // SSE
  SSE_PING_INTERVAL_MS: 25 * 1000, // 25 s

  // Rate-limiter windows
  RATE_WINDOW_AUTH_MS: 15 * 60 * 1000,    // 15 min
  RATE_WINDOW_API_MS: 15 * 60 * 1000,     // 15 min
  RATE_WINDOW_POST_MS: 60 * 60 * 1000,    // 1 h
  RATE_WINDOW_LIST_MS: 5 * 60 * 1000,     // 5 min

  // Upload limits
  UPLOAD_MAX_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB

  // Pagination defaults
  DEFAULT_PAGE_LIMIT: 12,
};
