const Resource = require('../models/Resource.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// List resources (published only unless query includes draft flag for admin/therapist)
exports.getResources = asyncHandler(async (req, res) => {
  const { type, category, search, page = 1, limit = 12 } = req.query;
  const filter = { isPublished: true };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const resources = await Resource.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number.parseInt(limit, 10))
    .skip(skip);

  const total = await Resource.countDocuments(filter);

  res.json(
    new ApiResponse(
      200,
      {
        resources,
        pagination: {
          page: Number.parseInt(page, 10),
          limit: Number.parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      'Resources retrieved successfully'
    )
  );
});

// Get single resource
exports.getResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource || (!resource.isPublished && req.user?.userType !== 'therapist')) {
    throw new ApiError(404, 'Resource not found');
  }

  // increment view count
  resource.viewCount += 1;
  await resource.save();

  res.json(new ApiResponse(200, { resource }, 'Resource retrieved successfully'));
});

// Create resource (treated as admin/therapist)
exports.createResource = asyncHandler(async (req, res) => {
  const resource = await Resource.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, { resource }, 'Resource created successfully'));
});

// Update resource
exports.updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  // Only the creator or an admin may update
  if (
    resource.createdBy &&
    String(resource.createdBy) !== String(req.user._id) &&
    req.user.userType !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to edit this resource');
  }

  const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.json(new ApiResponse(200, { resource: updated }, 'Resource updated successfully'));
});

// Delete resource
exports.deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);
  if (!resource) {
    throw new ApiError(404, 'Resource not found');
  }

  // Only the creator or an admin may delete
  if (
    resource.createdBy &&
    String(resource.createdBy) !== String(req.user._id) &&
    req.user.userType !== 'admin'
  ) {
    throw new ApiError(403, 'You do not have permission to delete this resource');
  }

  await resource.deleteOne();
  res.json(new ApiResponse(200, null, 'Resource deleted successfully'));
});
