const User = require('../models/User.model');
const Session = require('../models/Session.model');
const Review = require('../models/Review.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const uploadService = require('../services/upload.service');
const { deleteUserAccountData } = require('../services/accountCleanup.service');

// Get user profile
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, { user }, 'User retrieved successfully'));
});

// Update own profile (name/bio)
exports.updateUser = asyncHandler(async (req, res) => {
  if (req.user.id.toString() !== req.params.id) {
    throw new ApiError(403, 'You can only update your own profile');
  }

  const { fullName, bio } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { fullName, bio },
    { returnDocument: 'after', runValidators: true }
  );

  res.json(new ApiResponse(200, { user }, 'User updated successfully'));
});

// Delete own account
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.user.id.toString() !== req.params.id) {
    throw new ApiError(403, 'You can only delete your own account');
  }

  await deleteUserAccountData(req.params.id);
  res.json(new ApiResponse(200, null, 'User deleted successfully'));
});

// Update avatar
exports.updateAvatar = asyncHandler(async (req, res) => {
  if (req.user.id.toString() !== req.params.id) {
    throw new ApiError(403, 'You can only update your own avatar');
  }
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const result = await uploadService.uploadImage(req.file, 'avatars');
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { avatarUrl: result.url },
    { returnDocument: 'after' }
  );

  res.json(new ApiResponse(200, { user, avatarUrl: result.url }, 'Avatar updated successfully'));
});

// User stats (sessions and reviews)
exports.getUserStats = asyncHandler(async (req, res) => {
  if (req.user.id.toString() !== req.params.id) {
    throw new ApiError(403, 'You can only view your own stats');
  }

  const userId = req.params.id;
  const userExists = await User.exists({ _id: userId });
  if (!userExists) throw new ApiError(404, 'User not found');

  const [sessions, reviews] = await Promise.all([
    Session.countDocuments({ userId }),
    Review.countDocuments({ userId }),
  ]);

  res.json(new ApiResponse(200, { stats: { sessions, reviews } }, 'User stats retrieved successfully'));
});
