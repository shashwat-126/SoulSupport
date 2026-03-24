/**
 * Calculate pagination metadata
 */
const getPaginationMetadata = (page, limit, total) => {
  return {
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10),
    total,
    pages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
};

module.exports = {
  getPaginationMetadata,
};
