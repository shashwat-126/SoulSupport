'use strict';

const REQUIRED_ALL = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];
const REQUIRED_PROD = ['PORT'];

const PLACEHOLDER_PATTERNS = [
  /your-/i,
  /change-in-production/i,
  /example\./i,
  /replace-me/i,
  /dummy/i,
  /test/i,
];

function isBlank(value) {
  return typeof value !== 'string' || value.trim().length === 0;
}

function validateRequired(key, errors) {
  if (isBlank(process.env[key])) {
    errors.push(`${key} is required`);
  }
}

function validateUrl(key, errors) {
  const raw = process.env[key];
  if (isBlank(raw)) {
    return;
  }

  try {
    // URL constructor validates structure (protocol, host, etc.).
    // eslint-disable-next-line no-new
    new URL(raw);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

function hasPlaceholderValue(value) {
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value || ''));
}

function validateEnvironment() {
  const errors = [];
  const nodeEnv = process.env.NODE_ENV || 'development';

  REQUIRED_ALL.forEach((key) => validateRequired(key, errors));
  if (nodeEnv === 'production') {
    REQUIRED_PROD.forEach((key) => validateRequired(key, errors));
  }

  validateUrl('FRONTEND_URL', errors);

  if (!isBlank(process.env.JWT_SECRET) && process.env.JWT_SECRET.trim().length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters');
  }

  if (!isBlank(process.env.MONGODB_URI) && !/^mongodb(\+srv)?:\/\//.test(process.env.MONGODB_URI)) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  if (nodeEnv === 'production') {
    const prodSensitiveKeys = ['JWT_SECRET', 'MONGODB_URI'];
    for (const key of prodSensitiveKeys) {
      const value = process.env[key];
      if (!isBlank(value) && hasPlaceholderValue(value)) {
        errors.push(`${key} appears to contain a placeholder value`);
      }
    }

    if ((process.env.FRONTEND_URL || '').includes('localhost')) {
      errors.push('FRONTEND_URL cannot use localhost in production');
    }
  }

  if (errors.length > 0) {
    const details = errors.map((item) => `  - ${item}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
}

module.exports = {
  validateEnvironment,
};
