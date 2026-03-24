const User = require('../models/User.model');
const TherapistProfile = require('../models/TherapistProfile.model');
const Session = require('../models/Session.model');
const Review = require('../models/Review.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { deleteUserAccountData } = require('../services/accountCleanup.service');

// ─── Therapist Verification Queue ────────────────────────────────────────────

/**
 * GET /api/admin/therapists/unverified
 * List therapists that have not yet been verified.
 */
exports.getUnverifiedTherapists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [profiles, total] = await Promise.all([
    TherapistProfile.find({ isVerified: false })
      .populate('userId', 'fullName email createdAt')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit)),
    TherapistProfile.countDocuments({ isVerified: false }),
  ]);

  res.json(
    new ApiResponse(200, {
      profiles,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    }, 'Unverified therapists retrieved')
  );
});

/**
 * PUT /api/admin/therapists/:profileId/verify
 * Verify (or un-verify) a therapist profile.
 * Body: { isVerified: boolean }
 */
exports.setTherapistVerified = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  if (typeof isVerified !== 'boolean') {
    throw new ApiError(400, 'isVerified must be a boolean');
  }

  const profile = await TherapistProfile.findByIdAndUpdate(
    req.params.profileId,
    { isVerified },
    { new: true, runValidators: true }
  ).populate('userId', 'fullName email');

  if (!profile) {
    throw new ApiError(404, 'Therapist profile not found');
  }

  res.json(new ApiResponse(200, { profile }, `Therapist ${isVerified ? 'verified' : 'unverified'} successfully`));
});

// ─── User Management ─────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List all users with optional search/filter.
 */
exports.getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userType, search, isActive } = req.query;
  const skip = (page - 1) * limit;

  const filter = {};
  if (userType) filter.userType = userType;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('fullName email userType isActive isEmailVerified lastLogin createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.json(
    new ApiResponse(200, {
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    }, 'Users retrieved')
  );
});

/**
 * PUT /api/admin/users/:userId/active
 * Activate or deactivate a user account.
 * Body: { isActive: boolean }
 */
exports.setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean');
  }

  if (String(req.params.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot deactivate your own admin account');
  }

  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { isActive },
    { new: true }
  ).select('fullName email userType isActive');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`));
});

/**
 * DELETE /api/admin/users/:userId
 * Hard-delete a user and all their data.
 */
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.userId) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own admin account');
  }

  const user = await User.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await deleteUserAccountData(req.params.userId, { deleteUser: true });

  res.json(new ApiResponse(200, null, 'User and all associated data deleted'));
});

// ─── Platform Analytics ───────────────────────────────────────────────────────

/**
 * GET /api/admin/analytics
 * Basic platform-wide counts.
 */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [totalUsers, totalTherapists, verifiedTherapists, totalSessions, completedSessions, totalReviews] =
    await Promise.all([
      User.countDocuments({ userType: 'user', isActive: true }),
      User.countDocuments({ userType: 'therapist', isActive: true }),
      TherapistProfile.countDocuments({ isVerified: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Review.countDocuments(),
    ]);

  res.json(
    new ApiResponse(200, {
      users: { total: totalUsers },
      therapists: { total: totalTherapists, verified: verifiedTherapists, pending: totalTherapists - verifiedTherapists },
      sessions: { total: totalSessions, completed: completedSessions },
      reviews: { total: totalReviews },
    }, 'Analytics retrieved')
  );
});
