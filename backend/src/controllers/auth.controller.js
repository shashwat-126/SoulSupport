const User = require('../models/User.model');
const TherapistProfile = require('../models/TherapistProfile.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const emailService = require('../services/email.service');
const crypto = require('crypto');
const { getDefaultAvatarPath } = require('../utils/defaultAvatar');

function createRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function createTherapistProfileIfNeeded(userType, userId, avatarUrl) {
  if (userType !== 'therapist') return;

  await TherapistProfile.create({
    userId,
    qualifications: 'To be completed',
    hourlyRate: 0,
    specializations: [],
    photoUrl: avatarUrl,
  });
}

async function setEmailVerificationToken(user) {
  const verifyToken = createRawToken();
  user.emailVerificationToken = hashToken(verifyToken);
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save();

  return verifyToken;
}

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res) => {
  const { email, password, fullName, userType, bio } = req.body;
  const avatarUrl = getDefaultAvatarPath(email);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  const user = await User.create({
    email,
    password,
    fullName,
    userType,
    bio,
    avatarUrl,
  });

  await createTherapistProfileIfNeeded(userType, user._id, avatarUrl);

  const token = user.generateAuthToken();

  const verifyToken = await setEmailVerificationToken(user);
  const emailVerificationEnabled = emailService.isEnabled();

  res.status(201).json(
    new ApiResponse(
      201,
      {
        user: user.toJSON(),
        token,
        emailVerificationSent: emailVerificationEnabled,
      },
      'Registration successful'
    )
  );

  if (emailVerificationEnabled) {
    emailService
      .sendVerificationEmail(user.email, verifyToken)
      .catch((err) => {
        console.warn('Failed to send verification email (continuing):', err.message);
      });
  }
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = user.generateAuthToken();

  res.json(
    new ApiResponse(
      200,
      {
        user: user.toJSON(),
        token,
      },
      'Login successful'
    )
  );
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, { user }, 'User retrieved successfully'));
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  res.json(new ApiResponse(200, null, 'Logout successful'));
});

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, 'No user found with that email');
  }

  const resetToken = createRawToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  await emailService.sendPasswordResetEmail(email, resetToken);

  res.json(
    new ApiResponse(200, null, 'Password reset email sent successfully')
  );
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = hashToken(token);

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json(new ApiResponse(200, null, 'Password reset successful'));
});

/**
 * @desc    Validate a password-reset token (no side-effects)
 * @route   GET /api/auth/validate-reset-token?token=xxx
 * @access  Public
 */
exports.validateResetToken = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, 'Token is required');

  const hashedToken = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select('_id');

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  res.json(new ApiResponse(200, null, 'Token is valid'));
});

/**
 * @desc    Verify email
 * @route   POST /api/auth/verify-email
 * @access  Public (token-based)
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const hashed = hashToken(token);

  const user = await User.findOne({
    emailVerificationToken: hashed,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  res.json(new ApiResponse(200, null, 'Email verified successfully'));
});
