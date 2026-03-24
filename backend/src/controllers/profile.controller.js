const User = require('../models/User.model');
const TherapistProfile = require('../models/TherapistProfile.model');
const Session = require('../models/Session.model');
const Review = require('../models/Review.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const uploadService = require('../services/upload.service');
const { deleteUserAccountData } = require('../services/accountCleanup.service');
const ForumPost = require('../models/ForumPost.model');
const logger = require('../utils/logger');

const USER_UPDATE_FIELDS = [
  'fullName',
  'username',
  'bio',
  'location',
  'mentalHealthGoals',
  'preferredTherapyTypes',
];

const THERAPIST_UPDATE_FIELDS = [
  'specializations',
  'qualifications',
  'experienceYears',
  'languages',
  'sessionPricing',
  'hourlyRate',
  'availability',
  'weeklyAvailability',
];

const USER_SETTINGS_SELECT = 'notificationPreferences accountPreferences email userType';

function getBearerToken(req) {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

async function getRequesterFromRequest(req) {
  const token = getBearerToken(req);
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const requester = await User.findById(decoded.id).select('_id isActive');
    if (!requester || requester.isActive === false) {
      return null;
    }

    return requester;
  } catch {
    return null;
  }
}

async function canRequesterViewPrivateProfile(requester, targetUserId) {
  if (!requester) {
    return false;
  }

  if (String(requester._id) === String(targetUserId)) {
    return true;
  }

  const sharedSession = await Session.exists({
    $or: [
      { userId: targetUserId, therapistId: requester._id },
      { therapistId: targetUserId, userId: requester._id },
    ],
  });

  return Boolean(sharedSession);
}

function ensureFound(record, message) {
  if (record) {
    return record;
  }

  throw new ApiError(404, message);
}

function buildDefinedUpdates(source, fields) {
  return fields.reduce((updates, field) => {
    if (source[field] !== undefined) {
      updates[field] = source[field];
    }

    return updates;
  }, {});
}

function isTherapist(user) {
  return user.userType === 'therapist';
}

function isEndUser(user) {
  return user.userType === 'user';
}

async function getTherapistProfileForUser(user) {
  if (isTherapist(user)) {
    return TherapistProfile.findOne({ userId: user._id });
  }

  return null;
}

async function buildProfileFromUser(user) {
  const therapistProfile = await getTherapistProfileForUser(user);
  const profile = mapPublicProfile(user, therapistProfile);

  if (isEndUser(user)) {
    profile.pastSessionsHistory = await buildSessionHistoryForUser(user._id);
  }

  return profile;
}

async function upsertTherapistProfileIfNeeded(user, payload) {
  if (isTherapist(user)) {
    const therapistUpdates = buildDefinedUpdates(payload, THERAPIST_UPDATE_FIELDS);

    await TherapistProfile.findOneAndUpdate(
      { userId: user._id },
      therapistUpdates,
      { returnDocument: 'after', runValidators: true, upsert: true }
    );
  }
}

function sanitizePublicProfile(profile) {
  if (profile) {
    return {
      _id: profile._id,
      userType: profile.userType,
      fullName: profile.fullName,
      username: profile.username,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      therapistProfile: profile.therapistProfile,
    };
  }

  return profile;
}

function mapTherapistPublicProfile(user, therapistProfile) {
  if (therapistProfile) {
    return {
      specializations: therapistProfile.specializations ?? [],
      qualifications: therapistProfile.qualifications,
      experienceYears: therapistProfile.experienceYears,
      languages: therapistProfile.languages ?? [],
      sessionPricing: therapistProfile.sessionPricing ?? therapistProfile.hourlyRate,
      hourlyRate: therapistProfile.hourlyRate,
      availability: therapistProfile.availability,
      weeklyAvailability: therapistProfile.weeklyAvailability,
      totalSessions: therapistProfile.totalSessions,
      averageRating: therapistProfile.rating,
      reviewCount: therapistProfile.totalReviews,
      professionalPhotoUrl:
        therapistProfile.professionalPhotoUrl ?? therapistProfile.photoUrl ?? user.avatarUrl,
    };
  }

  return null;
}

function mapPublicProfile(user, therapistProfile = null) {
  return {
    _id: user._id,
    userType: user.userType,
    fullName: user.fullName,
    username: user.username,
    bio: user.bio,
    location: user.location,
    avatarUrl: user.avatarUrl,
    email: user.email,
    createdAt: user.createdAt,
    lastActive: user.lastActive ?? user.lastLogin,
    mentalHealthGoals: user.mentalHealthGoals ?? [],
    preferredTherapyTypes: user.preferredTherapyTypes ?? [],
    therapistProfile: mapTherapistPublicProfile(user, therapistProfile),
  };
}

function getNotificationPreferences(notificationPreferences = {}) {
  return {
    emailSessionReminders: notificationPreferences.emailSessionReminders ?? true,
    emailCommunityReplies: notificationPreferences.emailCommunityReplies ?? true,
    inAppSessionUpdates: notificationPreferences.inAppSessionUpdates ?? true,
    inAppForumActivity: notificationPreferences.inAppForumActivity ?? true,
    marketingEmails: notificationPreferences.marketingEmails ?? false,
  };
}

function getAccountPreferences(accountPreferences = {}) {
  return {
    privateProfile: accountPreferences.privateProfile ?? false,
    twoFactorEnabled: accountPreferences.twoFactorEnabled ?? false,
  };
}

function mapUserSettings(user) {
  return {
    notificationPreferences: getNotificationPreferences(user.notificationPreferences),
    accountPreferences: getAccountPreferences(user.accountPreferences),
    accountSummary: {
      email: user.email,
      userType: user.userType,
    },
  };
}

function mergeSettingsUpdates(existingUser, payload) {
  const updates = {};

  if (payload.notificationPreferences) {
    updates.notificationPreferences = {
      ...existingUser.notificationPreferences?.toObject?.(),
      ...payload.notificationPreferences,
    };
  }

  if (payload.accountPreferences) {
    updates.accountPreferences = {
      ...existingUser.accountPreferences?.toObject?.(),
      ...payload.accountPreferences,
    };
  }

  return updates;
}

async function buildSessionHistoryForUser(userId) {
  const sessions = await Session.find({ userId }).sort({ sessionDate: -1 }).limit(20);
  return sessions.map((session) => ({
    sessionId: session._id,
    therapistId: session.therapistId,
    sessionDate: session.sessionDate,
    status: session.status,
    meetingStatus: session.meetingStatus,
  }));
}

exports.getMyProfile = asyncHandler(async (req, res) => {
  const user = ensureFound(await User.findById(req.user.id), 'User not found');
  const profile = await buildProfileFromUser(user);

  res.json(new ApiResponse(200, { profile }, 'Profile retrieved successfully'));
});

exports.getPublicProfile = asyncHandler(async (req, res) => {
  const user = ensureFound(await User.findById(req.params.id), 'Profile not found');

  if (user.accountPreferences?.privateProfile) {
    const requester = await getRequesterFromRequest(req);
    const canViewPrivateProfile = await canRequesterViewPrivateProfile(
      requester,
      user._id
    );

    if (canViewPrivateProfile === false) {
      throw new ApiError(404, 'Profile not found');
    }
  }

  const therapistProfile = await getTherapistProfileForUser(user);

  const profile = sanitizePublicProfile(mapPublicProfile(user, therapistProfile));

  const latestReviews = therapistProfile
    ? await Review.find({ therapistId: user._id, isVisible: true }).sort({ createdAt: -1 }).limit(10)
    : [];

  res.json(
    new ApiResponse(
      200,
      {
        profile,
        latestReviews,
      },
      'Public profile retrieved successfully'
    )
  );
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = ensureFound(await User.findById(req.user.id), 'User not found');
  const userUpdates = buildDefinedUpdates(req.body, USER_UPDATE_FIELDS);

  await User.findByIdAndUpdate(user._id, userUpdates, {
    returnDocument: 'after',
    runValidators: true,
  });

  await upsertTherapistProfileIfNeeded(user, req.body);

  const updatedUser = ensureFound(await User.findById(user._id), 'User not found');
  const profile = await buildProfileFromUser(updatedUser);

    // Propagate updated display name to forum posts/comments in the background
    if (userUpdates.fullName) {
      const newName = userUpdates.fullName;
      Promise.all([
        ForumPost.updateMany(
          { userId: user._id },
          { 'author.name': newName }
        ),
        ForumPost.updateMany(
          { 'comments.userId': user._id },
          { $set: { 'comments.$[elem].author.name': newName } },
          { arrayFilters: [{ 'elem.userId': user._id }] }
        ),
      ]).catch((err) => logger.error('Failed to propagate author name update', { error: err.message }));
    }

  res.json(new ApiResponse(200, { profile }, 'Profile updated successfully'));
});

exports.uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (req.file === undefined || req.file === null) {
    throw new ApiError(400, 'Please upload a photo');
  }

  const user = await User.findById(req.user.id);
  ensureFound(user, 'User not found');

  const result = await uploadService.uploadImage(req.file, 'profiles');
  await User.findByIdAndUpdate(user._id, { avatarUrl: result.url });

  if (user.userType === 'therapist') {
    await TherapistProfile.findOneAndUpdate(
      { userId: user._id },
      {
        photoUrl: result.url,
        professionalPhotoUrl: result.url,
      },
      { upsert: true }
    );
  }

  res.json(
    new ApiResponse(
      200,
      { photoUrl: result.url },
      'Profile photo uploaded successfully'
    )
  );
});

exports.getMySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(USER_SETTINGS_SELECT);
  ensureFound(user, 'User not found');

  res.json(
    new ApiResponse(
      200,
      {
        settings: mapUserSettings(user),
      },
      'Settings retrieved successfully'
    )
  );
});

exports.updateMySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  ensureFound(user, 'User not found');

  const updates = mergeSettingsUpdates(user, req.body);

  const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  }).select(USER_SETTINGS_SELECT);

  res.json(
    new ApiResponse(
      200,
      {
        settings: mapUserSettings(updatedUser),
      },
      'Settings updated successfully'
    )
  );
});

exports.deleteMyAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  ensureFound(user, 'User not found');

  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (isMatch === false) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  await deleteUserAccountData(user._id);

  res.json(new ApiResponse(200, null, 'Account deleted successfully'));
});
