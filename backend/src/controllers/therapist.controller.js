const TherapistProfile = require('../models/TherapistProfile.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const uploadService = require('../services/upload.service');
const { getPaginationMetadata } = require('../utils/helpers');

// Find therapist profile by profile id or fallback to user id
async function findTherapistByIdOrUser(id) {
  let therapist = await TherapistProfile.findById(id);
  if (!therapist) {
    therapist = await TherapistProfile.findOne({ userId: id });
  }
  return therapist;
}

const PUBLIC_THERAPIST_USER_FIELDS = 'fullName avatarUrl bio';

async function getVisibleTherapistUserIds() {
  const users = await User.find({
    userType: 'therapist',
    isActive: true,
    'accountPreferences.privateProfile': { $ne: true },
  }).select('_id');

  return users.map((user) => user._id);
}

function isVisiblePublicTherapist(therapist) {
  return Boolean(therapist?.userId);
}

function serializeTherapistProfile(therapistDoc) {
  if (!therapistDoc) {
    return null;
  }

  const therapist = therapistDoc.toObject();
  const populatedUser = therapist.userId && typeof therapist.userId === 'object'
    ? therapist.userId
    : null;

  return {
    ...therapist,
    user: populatedUser,
    userId: populatedUser?._id || therapist.userId,
  };
}

/**
 * @desc    Get all therapists
 * @route   GET /api/therapists
 * @access  Public
 */
exports.getTherapists = asyncHandler(async (req, res) => {
  const {
    specialization,
    minRating = 0,
    maxRate,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { isVerified: true };

  if (specialization) {
    filter.specializations = specialization;
  }

  if (minRating) {
    filter.rating = { $gte: Number.parseFloat(minRating) };
  }

  if (maxRate) {
    filter.hourlyRate = { $lte: Number.parseFloat(maxRate) };
  }

  const visibleUserIds = await getVisibleTherapistUserIds();
  filter.userId = { $in: visibleUserIds };

  const skip = (page - 1) * limit;

  const therapists = await TherapistProfile.find(filter)
    .populate('userId', PUBLIC_THERAPIST_USER_FIELDS)
    .sort({ rating: -1, totalReviews: -1 })
    .limit(Number.parseInt(limit, 10))
    .skip(skip);

  const transformedTherapists = therapists
    .filter(isVisiblePublicTherapist)
    .map(serializeTherapistProfile);

  const total = await TherapistProfile.countDocuments(filter);

  res.json(
    new ApiResponse(
      200,
      {
        therapists: transformedTherapists,
        pagination: getPaginationMetadata(page, limit, total),
      },
      'Therapists retrieved successfully'
    )
  );
});

/**
 * @desc    Get single therapist
 * @route   GET /api/therapists/:id
 * @access  Public
 */
exports.getTherapist = asyncHandler(async (req, res) => {
  const therapist = await findTherapistByIdOrUser(req.params.id);

  if (therapist) {
    await therapist.populate({
      path: 'userId',
      select: PUBLIC_THERAPIST_USER_FIELDS,
      match: {
        userType: 'therapist',
        isActive: true,
        'accountPreferences.privateProfile': { $ne: true },
      },
    });
  }

  if (!therapist || !isVisiblePublicTherapist(therapist)) {
    throw new ApiError(404, 'Therapist not found');
  }

  res.json(
    new ApiResponse(
      200,
      { therapist: serializeTherapistProfile(therapist) },
      'Therapist retrieved successfully'
    )
  );
});

/**
 * @desc    Get current therapist's own profile
 * @route   GET /api/therapists/profile
 * @access  Private (Therapist only)
 */
exports.getMyProfile = asyncHandler(async (req, res) => {
  if (req.user.userType !== 'therapist') {
    throw new ApiError(403, 'Only therapists can access this endpoint');
  }

  const therapist = await TherapistProfile.findOne({ userId: req.user.id })
    .populate('userId', 'fullName email avatarUrl bio');

  if (!therapist) {
    throw new ApiError(404, 'Therapist profile not found');
  }

  const serializedTherapist = serializeTherapistProfile(therapist);

  res.json(
    new ApiResponse(
      200,
      { therapist: serializedTherapist, ...serializedTherapist },
      'Profile retrieved successfully'
    )
  );
});

/**
 * @desc    Update therapist profile
 * @route   PUT /api/therapists/:id
 * @access  Private (Therapist only)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const targetId = req.params.id || req.user.id;
  const therapist = await findTherapistByIdOrUser(targetId);

  if (!therapist) {
    throw new ApiError(404, 'Therapist profile not found');
  }

  if (therapist.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to update this profile');
  }

  const updateData = req.body;

  // Persist name/bio changes to the base User document
  const { fullName, bio } = updateData;
  if (fullName !== undefined || bio !== undefined) {
    await User.findByIdAndUpdate(
      therapist.userId,
      {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
      { returnDocument: 'after' }
    );
  }

  const updatedTherapist = await TherapistProfile.findByIdAndUpdate(
    therapist._id,
    updateData,
    { returnDocument: 'after', runValidators: true }
  ).populate('userId', 'fullName email avatarUrl bio');

  const serializedTherapist = serializeTherapistProfile(updatedTherapist);

  res.json(
    new ApiResponse(
      200,
      { therapist: serializedTherapist, ...serializedTherapist },
      'Profile updated successfully'
    )
  );
});

/**
 * @desc    Upload therapist photo
 * @route   POST /api/therapists/:id/photo
 * @access  Private (Therapist only)
 */
exports.uploadPhoto = asyncHandler(async (req, res) => {
  const therapist = await findTherapistByIdOrUser(req.params.id);

  if (!therapist) {
    throw new ApiError(404, 'Therapist profile not found');
  }

  if (therapist.userId.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Not authorized to update this profile');
  }

  if (!req.file) {
    throw new ApiError(400, 'Please upload a photo');
  }

  const result = await uploadService.uploadImage(req.file, 'therapists');

  therapist.photoUrl = result.url;
  await therapist.save();

  // Keep user avatar in sync
  await User.findByIdAndUpdate(therapist.userId, { avatarUrl: result.url });

  res.json(
    new ApiResponse(
      200,
      { photoUrl: result.url },
      'Photo uploaded successfully'
    )
  );
});

/**
 * @desc    Get therapist reviews
 * @route   GET /api/therapists/:id/reviews
 * @access  Public
 */
exports.getReviews = asyncHandler(async (req, res) => {
  const therapist = await findTherapistByIdOrUser(req.params.id);

  if (therapist) {
    await therapist.populate({
      path: 'userId',
      select: PUBLIC_THERAPIST_USER_FIELDS,
      match: {
        userType: 'therapist',
        isActive: true,
        'accountPreferences.privateProfile': { $ne: true },
      },
    });
  }

  if (!therapist || !isVisiblePublicTherapist(therapist)) {
    throw new ApiError(404, 'Therapist not found');
  }

  const Review = require('../models/Review.model');
  const reviews = await Review.find({ therapistId: therapist.userId, isVisible: true })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json(
    new ApiResponse(200, { reviews }, 'Reviews retrieved successfully')
  );
});

/**
 * @desc    Check therapist availability
 * @route   GET /api/therapists/:id/availability
 * @access  Public
 */
exports.checkAvailability = asyncHandler(async (req, res) => {
  const { date, time } = req.query;

  if (!date || !time) {
    throw new ApiError(400, 'Date and time are required');
  }

  const therapist = await findTherapistByIdOrUser(req.params.id);

  if (therapist) {
    await therapist.populate({
      path: 'userId',
      select: PUBLIC_THERAPIST_USER_FIELDS,
      match: {
        userType: 'therapist',
        isActive: true,
        'accountPreferences.privateProfile': { $ne: true },
      },
    });
  }

  if (!therapist || !isVisiblePublicTherapist(therapist)) {
    throw new ApiError(404, 'Therapist not found');
  }

  const Session = require('../models/Session.model');
  const sessionDate = new Date(`${date}T${time}`);

  const existingSession = await Session.findOne({
    therapistId: therapist.userId,
    sessionDate,
    status: { $in: ['pending', 'confirmed'] },
  });

  res.json(
    new ApiResponse(
      200,
      { available: !existingSession },
      existingSession ? 'Time slot not available' : 'Time slot available'
    )
  );
});
