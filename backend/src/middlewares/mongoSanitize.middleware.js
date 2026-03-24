function sanitizeMongoOperators(target) {
  if (!target || typeof target !== 'object') return;

  if (Array.isArray(target)) {
    target.forEach((item) => sanitizeMongoOperators(item));
    return;
  }

  Object.keys(target).forEach((key) => {
    if (key.includes('$') || key.includes('.')) {
      delete target[key];
      return;
    }

    sanitizeMongoOperators(target[key]);
  });
}

function mongoSanitizeCompat(req, res, next) {
  sanitizeMongoOperators(req.body);
  sanitizeMongoOperators(req.params);
  sanitizeMongoOperators(req.query);
  next();
}

module.exports = {
  mongoSanitizeCompat,
};