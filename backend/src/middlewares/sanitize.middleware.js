/**
 * Strips all HTML tags and dangerous content from user-supplied text fields.
 * Use for: forum content, comments, session notes, bio fields.
 */
const sanitizeHtml = require('sanitize-html');

const PLAIN_TEXT_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Strip all HTML from a string, returning plain text.
 * Returns the original value unchanged if it is not a string.
 */
function sanitizePlainText(value) {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, PLAIN_TEXT_OPTIONS).trim();
}

/**
 * Express middleware that sanitizes specific fields in req.body.
 * @param {string[]} fields - body field names to sanitize
 */
function sanitizeFields(...fields) {
  return (req, _res, next) => {
    for (const field of fields) {
      if (req.body && req.body[field] !== undefined) {
        req.body[field] = sanitizePlainText(req.body[field]);
      }
    }
    next();
  };
}

module.exports = { sanitizePlainText, sanitizeFields };
