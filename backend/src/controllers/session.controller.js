const Session = require('../models/Session.model');
const SlotHold = require('../models/SlotHold.model');
const User = require('../models/User.model');
const TherapistProfile = require('../models/TherapistProfile.model');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');
const ratingService = require('../services/rating.service');
const realtimeService = require('../services/realtime.service');

const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];
const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];
const TERMINAL_STATUSES = new Set([
  'cancelled_by_user',
  'cancelled_by_therapist',
  'completed',
  'expired',
]);
const THERAPIST_MANAGED_STATUSES = new Set([
  'confirmed',
  'cancelled_by_therapist',
]);
const HOLD_TIMEOUT_MINUTES = Number(process.env.SLOT_HOLD_MINUTES || 10);

function isSessionParticipant(session, userId) {
  const userIdStr = String(userId);
  return (
    String(session.userId) === userIdStr ||
    String(session.therapistId) === userIdStr
  );
}

function logSessionSideEffectError(context, error) {
  console.error(`Session side effect failed: ${context}`, error);
}

function emitSessionUpdateEvent(session, action) {
  realtimeService.emitSessionUpdate({
    therapistId: session.therapistId,
    userId: session.userId,
    session,
    action,
  });
}

function emitSlotUpdateEvent(session, state) {
  realtimeService.emitSlotUpdate({
    therapistId: session.therapistId,
    sessionDate: session.sessionDate,
    slotHour: new Date(session.sessionDate).getHours(),
    state,
    sessionId: session._id,
  });
}

async function getSessionOrThrow(sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(404, 'Session not found');
  }
  return session;
}

function normalizeCancelReason(reason) {
  if (typeof reason !== 'string') {
    return undefined;
  }

  const trimmedReason = reason.trim();
  return trimmedReason || undefined;
}

function buildCancellationFields({ cancelledBy, reason }) {
  const status = cancelledBy === 'user' ? 'cancelled_by_user' : 'cancelled_by_therapist';
  const normalizedReason = normalizeCancelReason(reason);

  return {
    status,
    meetingStatus: 'cancelled',
    meetingEndedAt: new Date(),
      ...(cancelledBy === 'user'
      ? {
          sessionStatusUser: 'cancelled',
          cancellationReasonUser: normalizedReason,
        }
      : {
          sessionStatusTherapist: 'cancelled',
          cancellationReasonTherapist: normalizedReason,
        }),
  };
}

function parseHour(timeStr) {
  return Number.parseInt((timeStr || '00:00').split(':')[0], 10);
}

function normalizeToHour(dateValue) {
  const date = new Date(dateValue);
  date.setMinutes(0, 0, 0);
  return date;
}

function getTokenFromRequest(req) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.query?.token) {
    return String(req.query.token);
  }

  return null;
}

async function resolveAuthenticatedUser(req) {
  const token = getTokenFromRequest(req);
  if (!token) {
    throw new ApiError(401, 'Not authorized to access this route');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  return user;
}

function parseHourCandidate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(23, Math.floor(value)));
  }

  if (typeof value !== 'string') {
    return null;
  }

  const hour = Number.parseInt(value.split(':')[0], 10);
  if (Number.isNaN(hour)) {
    return null;
  }

  return Math.max(0, Math.min(23, hour));
}

function getDayHoursFromWeeklyAvailability(dayName, weeklyAvailability = {}) {
  const rawSlots = weeklyAvailability?.[dayName];
  if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
    return [];
  }

  return rawSlots
    .map((slot) => parseHourCandidate(slot))
    .filter((hour) => hour !== null);
}

function hasWeeklyAvailabilityOverrides(weeklyAvailability = {}) {
  return DAY_NAMES.some((dayName) => {
    const value = weeklyAvailability?.[dayName];
    return Array.isArray(value) && value.length > 0;
  });
}

function getAllowedHoursForDay(therapistProfile, dayName) {
  const weeklyAvailability = therapistProfile.weeklyAvailability || {};
  const hasWeeklyOverrides = hasWeeklyAvailabilityOverrides(weeklyAvailability);
  const weeklyHours = getDayHoursFromWeeklyAvailability(dayName, weeklyAvailability);

  if (hasWeeklyOverrides) {
    return [...new Set(weeklyHours)].sort((a, b) => a - b);
  }

  const startHour = parseHour(therapistProfile.availability?.timeStart || '09:00');
  const endHour = parseHour(therapistProfile.availability?.timeEnd || '17:00');

  const hours = [];
  for (let hour = startHour; hour < endHour; hour += 1) {
    hours.push(hour);
  }

  return hours;
}

function getSessionWindowBounds(sessionDate, durationMinutes = 60) {
  const start = new Date(sessionDate);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start, end };
}

function getHoldExpiryDate() {
  return new Date(Date.now() + HOLD_TIMEOUT_MINUTES * 60 * 1000);
}

function formatAvailabilityRange(therapistProfile) {
  return `${therapistProfile.availability?.timeStart || '09:00'} and ${
    therapistProfile.availability?.timeEnd || '17:00'
  }`;
}

function canAccessMeetingNow(session) {
  const now = new Date();
  const { start, end } = getSessionWindowBounds(
    session.sessionDate,
    session.durationMinutes || 60
  );
  const earlyJoinWindow = new Date(start.getTime() - 15 * 60 * 1000);
  return now >= earlyJoinWindow && now <= end;
}

function buildJitsiRoom(sessionId) {
  const roomId = `soulsupport-session-${sessionId}-${Date.now()}`;
  return {
    meetingRoomId: roomId,
    meetingLink: `https://meet.jit.si/${roomId}`,
  };
}

function buildConfirmBlockedMessage(status) {
  if (status === 'cancelled_by_user') {
    return 'Booking cannot be confirmed because it has already been cancelled by the user.';
  }
  if (status === 'cancelled_by_therapist') {
    return 'Booking cannot be confirmed because it has already been cancelled by the therapist.';
  }
  if (status === 'completed') {
    return 'Booking cannot be confirmed because it has already been completed.';
  }
  if (status === 'expired') {
    return 'Booking cannot be confirmed because it has expired.';
  }
  if (status === 'confirmed') {
    return 'Booking is already confirmed.';
  }
  return 'Invalid booking state transition.';
}

function isCancellationStatus(status) {
  return status === 'cancelled_by_user' || status === 'cancelled_by_therapist';
}

function getParticipantRoles(session, userId) {
  return {
    isUser: String(session.userId) === String(userId),
    isTherapist: String(session.therapistId) === String(userId),
  };
}

function assertParticipantCanUpdateCompletion({ isUser, isTherapist }) {
  if (!isUser && !isTherapist) {
    throw new ApiError(403, 'Not authorized to update this session');
  }
}

function assertCompletionUpdateAllowed(session) {
  if (session.status !== 'confirmed') {
    throw new ApiError(
      409,
      `Completion update is not allowed for '${session.status}' sessions`
    );
  }
}

function validateCancellationCompletionRequest({ status, cancellationReason, isUser, isTherapist }) {
  if (!isCancellationStatus(status)) {
    return;
  }

  if (!cancellationReason) {
    throw new ApiError(400, 'Cancellation reason is required when status is cancelled');
  }

  if (isUser && status !== 'cancelled_by_user') {
    throw new ApiError(403, 'Users can only set cancellation status to cancelled_by_user');
  }

  if (isTherapist && status !== 'cancelled_by_therapist') {
    throw new ApiError(403, 'Therapists can only set cancellation status to cancelled_by_therapist');
  }
}

function applyCompletionStatusMutation({ session, status, cancellationReason, isUser, isTherapist }) {
  if (status === 'completed') {
    if (isUser) session.sessionStatusUser = 'completed';
    if (isTherapist) session.sessionStatusTherapist = 'completed';
    return;
  }

  if (status === 'cancelled_by_user') {
    Object.assign(
      session,
      buildCancellationFields({ cancelledBy: 'user', reason: cancellationReason })
    );
    return;
  }

  if (status === 'cancelled_by_therapist') {
    Object.assign(
      session,
      buildCancellationFields({
        cancelledBy: 'therapist',
        reason: cancellationReason,
      })
    );
  }
}

function finalizeSessionCompletionIfReady(session) {
  if (
    session.sessionStatusUser === 'completed' &&
    session.sessionStatusTherapist === 'completed' &&
    session.status === 'confirmed'
  ) {
    session.status = 'completed';
    session.meetingStatus = 'completed';
    session.meetingEndedAt = new Date();
    ratingService.incrementSessionCount(session.therapistId).catch((error) => {
      logSessionSideEffectError('incrementSessionCount', error);
    });
  }
}

function assertTherapistStatusTransitionAllowed(status) {
  if (!THERAPIST_MANAGED_STATUSES.has(status)) {
    throw new ApiError(400, 'Therapist can only confirm or cancel bookings from this endpoint');
  }
}

function assertTherapistOwnsSession(session, therapistUserId) {
  if (session.therapistId.toString() !== therapistUserId.toString()) {
    throw new ApiError(403, 'Only therapist can update session status');
  }
}

function resolveMeetingFieldsForConfirmation(session) {
  if (session.meetingLink && session.meetingRoomId) {
    return {
      meetingLink: session.meetingLink,
      meetingRoomId: session.meetingRoomId,
    };
  }

  return buildJitsiRoom(session._id);
}

async function confirmSessionForTherapist(session, therapistUserId) {
  const generatedMeeting = resolveMeetingFieldsForConfirmation(session);

  const confirmedSession = await Session.findOneAndUpdate(
    {
      _id: session._id,
      therapistId: therapistUserId,
      status: 'pending',
    },
    {
      $set: {
        status: 'confirmed',
        meetingLink: generatedMeeting.meetingLink,
        meetingRoomId: generatedMeeting.meetingRoomId,
        meetingStatus: 'scheduled',
      },
    },
    { returnDocument: 'after' }
  );

  if (!confirmedSession) {
    const latestSession = await Session.findById(session._id);
    throw new ApiError(409, buildConfirmBlockedMessage(latestSession?.status));
  }

  return confirmedSession;
}

function notifySessionConfirmedSideEffects(confirmedSession) {
  notificationService
    .notifySessionConfirmed(
      confirmedSession.userId,
      confirmedSession.therapistId,
      confirmedSession._id,
      confirmedSession.therapist.name
    )
    .catch((error) => {
      logSessionSideEffectError('notifySessionConfirmed', error);
    });

  emailService
    .sendSessionConfirmationEmail(
      confirmedSession.user.email,
      confirmedSession.therapist.name,
      confirmedSession.sessionDate.toLocaleString()
    )
    .catch((error) => {
      logSessionSideEffectError('sendSessionConfirmationEmail', error);
    });
}

function assertTherapistCancellationReason(status, cancelReason) {
  if (status === 'cancelled_by_therapist' && !cancelReason) {
    throw new ApiError(400, 'Cancellation reason is required when therapist cancels');
  }
}

async function cancelSessionForTherapist(session, therapistUserId, cancelReason) {
  const cancelledSession = await Session.findOneAndUpdate(
    {
      _id: session._id,
      therapistId: therapistUserId,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    },
    {
      $set: {
        ...buildCancellationFields({
          cancelledBy: 'therapist',
          reason: cancelReason,
        }),
      },
    },
    { returnDocument: 'after' }
  );

  if (!cancelledSession) {
    const latestSession = await Session.findById(session._id);
    throw new ApiError(
      409,
      `Booking cannot be cancelled because it is already in '${latestSession?.status}' state.`
    );
  }

  return cancelledSession;
}

function isSessionExpired(session) {
  const { end } = getSessionWindowBounds(
    session.sessionDate,
    session.durationMinutes || 60
  );
  return new Date() > end;
}

async function markExpiredIfNeeded(session) {
  if (
    !session ||
    !ACTIVE_BOOKING_STATUSES.includes(session.status) ||
    !isSessionExpired(session)
  ) {
    return session;
  }

  const expiredSession = await Session.findOneAndUpdate(
    { _id: session._id, status: { $in: ACTIVE_BOOKING_STATUSES } },
    {
      $set: {
        status: 'expired',
        meetingStatus: 'cancelled',
        meetingEndedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  if (expiredSession) {
    emitSessionUpdateEvent(expiredSession, 'session_expired');
    emitSlotUpdateEvent(expiredSession, 'released');
  }

  return expiredSession || session;
}

async function expireSessionsMatchingFilter(baseFilter) {
  const now = new Date();
  const staleSessions = await Session.find({
    ...baseFilter,
    status: { $in: ACTIVE_BOOKING_STATUSES },
    sessionDate: { $lt: now },
  }).select('_id therapistId userId sessionDate');

  if (!staleSessions.length) {
    return;
  }

  const staleSessionIds = staleSessions.map((session) => session._id);
  await Session.updateMany(
    {
      _id: { $in: staleSessionIds },
      status: { $in: ACTIVE_BOOKING_STATUSES },
    },
    {
      $set: {
        status: 'expired',
        meetingStatus: 'cancelled',
        meetingEndedAt: now,
      },
    }
  );

  staleSessions.forEach((session) => {
    emitSessionUpdateEvent(
      {
        _id: session._id,
        therapistId: session.therapistId,
        userId: session.userId,
        sessionDate: session.sessionDate,
        status: 'expired',
        meetingStatus: 'cancelled',
      },
      'session_expired'
    );

    emitSlotUpdateEvent(
      {
        _id: session._id,
        therapistId: session.therapistId,
        userId: session.userId,
        sessionDate: session.sessionDate,
      },
      'released'
    );
  });
}

async function getTherapistProfileByUserId(therapistId) {
  const therapistProfile = await TherapistProfile.findOne({
    userId: therapistId,
  }).populate('userId');

  if (!therapistProfile || !therapistProfile.userId) {
    throw new ApiError(404, 'Therapist not found');
  }

  if (therapistProfile.userId.userType !== 'therapist') {
    throw new ApiError(404, 'Therapist not found');
  }

  return therapistProfile;
}

async function expireStaleHolds(filter = {}) {
  const now = new Date();
  const staleHolds = await SlotHold.find({
    ...filter,
    status: 'active',
    expiresAt: { $lte: now },
  });

  if (!staleHolds.length) {
    return;
  }

  const staleIds = staleHolds.map((hold) => hold._id);
  await SlotHold.updateMany(
    { _id: { $in: staleIds }, status: 'active' },
    { $set: { status: 'expired' } }
  );

  staleHolds.forEach((hold) => {
    realtimeService.emitSlotUpdate({
      therapistId: hold.therapistId,
      sessionDate: hold.slotDate,
      slotHour: new Date(hold.slotDate).getHours(),
      state: 'released',
      sessionId: hold._id,
    });
  });
}

async function validateTherapistSlot({ therapistId, sessionDateTime }) {
  const therapistProfile = await getTherapistProfileByUserId(therapistId);
  const sessionHour = sessionDateTime.getHours();

  const bookingDay = DAY_NAMES[sessionDateTime.getDay()];
  const availableDays = therapistProfile.availability?.days || [];

  if (availableDays.length > 0 && !availableDays.includes(bookingDay)) {
    throw new ApiError(
      400,
      `Therapist is not available on ${bookingDay}. Available days: ${availableDays.join(', ')}`
    );
  }

  const allowedHours = getAllowedHoursForDay(therapistProfile, bookingDay);
  if (allowedHours.length === 0 || !allowedHours.includes(sessionHour)) {
    throw new ApiError(
      400,
      `Sessions must be booked between ${formatAvailabilityRange(therapistProfile)}`
    );
  }

  return { therapistProfile, sessionHour, bookingDay, allowedHours };
}

async function createBookedSession({ therapistId, sessionDateTime, durationMinutes, notes, userId }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { therapistProfile } = await validateTherapistSlot({
    therapistId,
    sessionDateTime,
  });

  const existingSession = await Session.findOne({
    therapistId,
    sessionDate: sessionDateTime,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  if (existingSession) {
    throw new ApiError(409, 'Time slot already reserved');
  }

  let session;
  try {
    session = await Session.create({
      therapistId,
      userId,
      therapist: {
        name: therapistProfile.userId.fullName,
        photoUrl: therapistProfile.photoUrl,
        specializations: therapistProfile.specializations,
      },
      user: {
        name: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      sessionDate: sessionDateTime,
      durationMinutes: durationMinutes || 60,
      notes,
      status: 'pending',
      meetingStatus: 'scheduled',
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'Time slot already reserved');
    }

    throw error;
  }

  emitSessionUpdateEvent(session, 'session_booked');
  emitSlotUpdateEvent(session, 'booked');

  notificationService
    .notifySessionBooked(therapistId, userId, session._id, user.fullName)
    .catch((error) => {
      logSessionSideEffectError('notifySessionBooked', error);
    });

  emailService
    .sendSessionBookingEmail(
      therapistProfile.userId.email,
      user.fullName,
      sessionDateTime.toLocaleString()
    )
    .catch((error) => {
      logSessionSideEffectError('sendSessionBookingEmail', error);
    });

  return session;
}

/**
 * @desc    Get user or therapist sessions
 * @route   GET /api/sessions
 * @access  Private
 */
exports.getSessions = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter =
    req.user.userType === 'therapist'
      ? { therapistId: req.user._id }
      : { userId: req.user._id };

  if (status) filter.status = status;

  await expireSessionsMatchingFilter(filter);

  const skip = (Number(page) - 1) * Number(limit);
  const sessions = await Session.find(filter)
    .sort({ sessionDate: -1 })
    .limit(Number(limit))
    .skip(skip);

  const total = await Session.countDocuments(filter);

  res.json(
    new ApiResponse(
      200,
      {
        sessions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      'Sessions retrieved successfully'
    )
  );
});

/**
 * @desc    Get upcoming sessions
 * @route   GET /api/sessions/upcoming
 * @access  Private
 */
exports.getUpcoming = asyncHandler(async (req, res) => {
  const filter =
    req.user.userType === 'therapist'
      ? { therapistId: req.user._id }
      : { userId: req.user._id };

  await expireSessionsMatchingFilter(filter);

  const upcomingSessions = await Session.find({
    ...filter,
    sessionDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
  })
    .sort({ sessionDate: 1 })
    .limit(20);

  res.json(new ApiResponse(200, { sessions: upcomingSessions }, 'Upcoming sessions retrieved'));
});

/**
 * @desc    Get available therapist slots by date
 * @route   GET /api/sessions/available-slots/:therapistId
 * @access  Public
 */
exports.getAvailableSlots = asyncHandler(async (req, res) => {
  const { therapistId } = req.params;
  const { date } = req.query;

  if (!date) throw new ApiError(400, 'Date is required');

  const therapistProfile = await getTherapistProfileByUserId(therapistId);
  const [year, month, day] = String(date).split('-').map(Number);
  const requestedDate = new Date(year, month - 1, day);
  const requestedDay = DAY_NAMES[requestedDate.getDay()];

  const availableDays = therapistProfile.availability?.days || [];
  if (availableDays.length > 0 && !availableDays.includes(requestedDay)) {
    return res.json(
      new ApiResponse(
        200,
        { bookedHours: [], availableDays, isAvailableDay: false },
        `Therapist is not available on ${requestedDay}`
      )
    );
  }

  const allowedHours = getAllowedHoursForDay(therapistProfile, requestedDay);

  if (allowedHours.length === 0) {
    return res.json(
      new ApiResponse(
        200,
        { bookedHours: [], availableHours: [], availableDays, isAvailableDay: false },
        `Therapist is not available on ${requestedDay}`
      )
    );
  }

  const startHour = Math.min(...allowedHours);
  const endHour = Math.max(...allowedHours) + 1;

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

  await expireStaleHolds({
    therapistId,
    slotDate: { $gte: startOfDay, $lte: endOfDay },
  });

  const bookedSessions = await Session.find({
    therapistId,
    sessionDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  const bookedHours = bookedSessions.map((session) =>
    new Date(session.sessionDate).getHours()
  );

  const activeHolds = await SlotHold.find({
    therapistId,
    slotDate: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
    status: 'active',
    expiresAt: { $gt: new Date() },
  });

  const pendingHours = activeHolds.map((hold) => new Date(hold.slotDate).getHours());

  const unavailableHours = [...new Set([...bookedHours, ...pendingHours])];

  const availableHours = allowedHours.filter((hour) => !unavailableHours.includes(hour));

  res.json(
    new ApiResponse(
      200,
      {
        bookedHours,
        pendingHours,
        unavailableHours,
        availableHours,
        allowedHours,
        startHour,
        endHour,
        availableDays,
        isAvailableDay: true,
      },
      'Available slots retrieved successfully'
    )
  );
});

/**
 * @desc    Create a new session
 * @route   POST /api/sessions
 * @access  Private (User only)
 */
exports.createSession = asyncHandler(async (req, res) => {
  const { therapistId, sessionDate, durationMinutes, notes } = req.body;

  if (req.user.userType !== 'user') {
    throw new ApiError(403, 'Only users can book sessions');
  }

  const sessionDateTime = normalizeToHour(sessionDate);
  await expireStaleHolds({ therapistId, slotDate: sessionDateTime });

  const blockingHold = await SlotHold.findOne({
    therapistId,
    slotDate: sessionDateTime,
    status: 'active',
    expiresAt: { $gt: new Date() },
    userId: { $ne: req.user._id },
  });

  if (blockingHold) {
    throw new ApiError(409, 'Time slot is currently on hold. Please try another slot.');
  }

  const session = await createBookedSession({
    therapistId,
    sessionDateTime,
    durationMinutes,
    notes,
    userId: req.user._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, { session }, 'Session booked successfully'));
});

/**
 * @desc    Create temporary booking hold for a slot
 * @route   POST /api/sessions/holds
 * @access  Private (User only)
 */
exports.createSlotHold = asyncHandler(async (req, res) => {
  const { therapistId, sessionDate, durationMinutes = 60 } = req.body;

  if (req.user.userType !== 'user') {
    throw new ApiError(403, 'Only users can create slot holds');
  }

  const slotDate = normalizeToHour(sessionDate);
  await validateTherapistSlot({ therapistId, sessionDateTime: slotDate });
  await expireStaleHolds({ therapistId, slotDate });

  const existingSession = await Session.findOne({
    therapistId,
    sessionDate: slotDate,
    status: { $in: ACTIVE_BOOKING_STATUSES },
  });

  if (existingSession) {
    throw new ApiError(409, 'Time slot already reserved');
  }

  const existingOwnHold = await SlotHold.findOne({
    therapistId,
    slotDate,
    userId: req.user._id,
    status: 'active',
    expiresAt: { $gt: new Date() },
  });

  if (existingOwnHold) {
    existingOwnHold.expiresAt = getHoldExpiryDate();
    await existingOwnHold.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        { hold: existingOwnHold, holdTimeoutMinutes: HOLD_TIMEOUT_MINUTES },
        'Slot hold refreshed'
      )
    );
  }

  const holdPayload = {
    therapistId,
    userId: req.user._id,
    slotDate,
    durationMinutes,
    status: 'active',
    expiresAt: getHoldExpiryDate(),
  };

  let hold;
  try {
    hold = await SlotHold.create(holdPayload);
  } catch (error) {
    if (error?.code === 11000) {
      throw new ApiError(409, 'This slot is currently held by another user');
    }
    throw error;
  }

  realtimeService.emitSlotUpdate({
    therapistId,
    sessionDate: slotDate,
    slotHour: slotDate.getHours(),
    state: 'pending',
    sessionId: hold._id,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { hold, holdTimeoutMinutes: HOLD_TIMEOUT_MINUTES },
      'Slot hold created successfully'
    )
  );
});

/**
 * @desc    Confirm an active hold and convert it to a booking
 * @route   POST /api/sessions/holds/:holdId/confirm
 * @access  Private (User only)
 */
exports.confirmSlotHold = asyncHandler(async (req, res) => {
  const { holdId } = req.params;
  const { notes } = req.body;

  if (req.user.userType !== 'user') {
    throw new ApiError(403, 'Only users can confirm slot holds');
  }

  const hold = await SlotHold.findById(holdId);
  if (!hold) {
    throw new ApiError(404, 'Slot hold not found');
  }

  if (String(hold.userId) !== req.user.id.toString()) {
    throw new ApiError(403, 'You are not authorized to confirm this slot hold');
  }

  if (hold.status !== 'active') {
    throw new ApiError(409, `Slot hold cannot be confirmed from '${hold.status}' state`);
  }

  if (hold.expiresAt <= new Date()) {
    hold.status = 'expired';
    await hold.save();

    realtimeService.emitSlotUpdate({
      therapistId: hold.therapistId,
      sessionDate: hold.slotDate,
      slotHour: new Date(hold.slotDate).getHours(),
      state: 'released',
      sessionId: hold._id,
    });

    throw new ApiError(409, 'Slot hold expired. Please choose the slot again');
  }

  let session;
  try {
    session = await createBookedSession({
      therapistId: hold.therapistId,
      sessionDateTime: hold.slotDate,
      durationMinutes: hold.durationMinutes || 60,
      notes,
      userId: req.user._id,
    });
  } catch (error) {
    if (error?.statusCode === 409 || error?.code === 11000) {
      hold.status = 'cancelled';
      await hold.save();

      realtimeService.emitSlotUpdate({
        therapistId: hold.therapistId,
        sessionDate: hold.slotDate,
        slotHour: new Date(hold.slotDate).getHours(),
        state: 'released',
        sessionId: hold._id,
      });
    }

    throw error;
  }

  hold.status = 'confirmed';
  await hold.save();

  res.status(201).json(
    new ApiResponse(201, { session }, 'Slot hold confirmed and session booked successfully')
  );
});

/**
 * @desc    Get single session
 * @route   GET /api/sessions/:id
 * @access  Private
 */
exports.getSession = asyncHandler(async (req, res) => {
  const session = await getSessionOrThrow(req.params.id);
  const normalizedSession = await markExpiredIfNeeded(session);

  if (!isSessionParticipant(normalizedSession, req.user.id)) {
    throw new ApiError(403, 'Not authorized to view this session');
  }

  const now = new Date();
  const { start, end } = getSessionWindowBounds(
    normalizedSession.sessionDate,
    normalizedSession.durationMinutes || 60
  );

  res.json(
    new ApiResponse(
      200,
      {
        session: normalizedSession,
        meetingAccess: {
          canJoinNow: canAccessMeetingNow(normalizedSession),
          startsAt: start,
          endsAt: end,
          isExpired: now > end,
        },
      },
      'Session retrieved successfully'
    )
  );
});

/**
 * @desc    Update session details (reschedule / notes)
 * @route   PUT /api/sessions/:id
 * @access  Private
 */
exports.updateSession = asyncHandler(async (req, res) => {
  const { sessionDate, durationMinutes, notes } = req.body;

  const session = await getSessionOrThrow(req.params.id);

  if (!isSessionParticipant(session, req.user.id)) {
    throw new ApiError(403, 'Not authorized to update this session');
  }

  if (TERMINAL_STATUSES.has(session.status)) {
    throw new ApiError(400, 'Cannot update completed or cancelled sessions');
  }

  if (sessionDate) session.sessionDate = normalizeToHour(sessionDate);
  if (durationMinutes) session.durationMinutes = durationMinutes;
  if (notes !== undefined) session.notes = notes;

  await session.save();

  res.json(new ApiResponse(200, { session }, 'Session updated successfully'));
});

/**
 * @desc    Update session status
 * @route   PUT /api/sessions/:id/status
 * @access  Private (Therapist only)
 */
exports.updateSessionStatus = asyncHandler(async (req, res) => {
  const { status, cancelReason: rawCancelReason } = req.body;
  const cancelReason = normalizeCancelReason(rawCancelReason);

  assertTherapistStatusTransitionAllowed(status);

  const currentSession = await getSessionOrThrow(req.params.id);
  assertTherapistOwnsSession(currentSession, req.user.id);

  const normalizedSession = await markExpiredIfNeeded(currentSession);

  if (status === 'confirmed') {
    const confirmedSession = await confirmSessionForTherapist(
      normalizedSession,
      req.user.id
    );

    notifySessionConfirmedSideEffects(confirmedSession);

    emitSessionUpdateEvent(confirmedSession, 'session_confirmed');
    emitSlotUpdateEvent(confirmedSession, 'booked');

    return res.json(
      new ApiResponse(200, { session: confirmedSession }, 'Session status updated successfully')
    );
  }

  assertTherapistCancellationReason(status, cancelReason);

  const cancelledSession = await cancelSessionForTherapist(
    normalizedSession,
    req.user.id,
    cancelReason
  );

  notificationService
    .notifySessionCancelled(cancelledSession.userId, cancelledSession._id, cancelReason)
    .catch((error) => {
      logSessionSideEffectError('notifySessionCancelledByTherapist', error);
    });

  emitSessionUpdateEvent(cancelledSession, 'session_cancelled_by_therapist');
  emitSlotUpdateEvent(cancelledSession, 'released');

  return res.json(
    new ApiResponse(200, { session: cancelledSession }, 'Session status updated successfully')
  );
});

/**
 * @desc    Get meeting access details
 * @route   GET /api/sessions/:id/meeting
 * @access  Private
 */
exports.getMeetingAccess = asyncHandler(async (req, res) => {
  const session = await getSessionOrThrow(req.params.id);
  const normalizedSession = await markExpiredIfNeeded(session);

  if (!isSessionParticipant(normalizedSession, req.user.id)) {
    throw new ApiError(403, 'Only booked users can access meeting page');
  }

  if (normalizedSession.status !== 'confirmed') {
    throw new ApiError(403, 'Meeting is available only for confirmed sessions');
  }

  if (!normalizedSession.meetingLink || !normalizedSession.meetingRoomId) {
    throw new ApiError(400, 'Meeting has not been scheduled yet');
  }

  const isInSessionWindow = canAccessMeetingNow(normalizedSession);

  if (!isInSessionWindow) {
    throw new ApiError(403, 'Meeting link accessible only during session window');
  }

  if (!normalizedSession.meetingStartedAt) {
    normalizedSession.meetingStartedAt = new Date();
  }
  normalizedSession.meetingStatus = 'active';
  await normalizedSession.save();

  res.json(
    new ApiResponse(
      200,
      {
        meetingLink: normalizedSession.meetingLink,
        meetingRoomId: normalizedSession.meetingRoomId,
        session: normalizedSession,
      },
      'Meeting access granted'
    )
  );
});

/**
 * @desc    Update completion status by participant
 * @route   PUT /api/sessions/:id/completion-status
 * @access  Private
 */
exports.updateCompletionStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason: rawCancellationReason } = req.body;
  const cancellationReason = normalizeCancelReason(rawCancellationReason);

  const session = await getSessionOrThrow(req.params.id);
  const normalizedSession = await markExpiredIfNeeded(session);

  const { isUser, isTherapist } = getParticipantRoles(normalizedSession, req.user.id);

  assertParticipantCanUpdateCompletion({ isUser, isTherapist });
  assertCompletionUpdateAllowed(normalizedSession);
  validateCancellationCompletionRequest({
    status,
    cancellationReason,
    isUser,
    isTherapist,
  });

  applyCompletionStatusMutation({
    session: normalizedSession,
    status,
    cancellationReason,
    isUser,
    isTherapist,
  });

  finalizeSessionCompletionIfReady(normalizedSession);

  await normalizedSession.save();

  emitSessionUpdateEvent(
    normalizedSession,
    status === 'completed' ? 'session_completed_status_updated' : 'session_cancelled'
  );

  if (isCancellationStatus(status)) {
    emitSlotUpdateEvent(normalizedSession, 'released');
  }

  res.json(
    new ApiResponse(200, { session: normalizedSession }, 'Session completion status updated')
  );
});

/**
 * @desc    Cancel session
 * @route   DELETE /api/sessions/:id
 * @access  Private
 */
exports.cancelSession = asyncHandler(async (req, res) => {
  const { cancelReason: rawCancelReason } = req.body || {};
  const cancelReason = normalizeCancelReason(rawCancelReason);

  const session = await getSessionOrThrow(req.params.id);
  const normalizedSession = await markExpiredIfNeeded(session);

  const isUserCancelling =
    String(normalizedSession.userId) === String(req.user.id);
  const isTherapistCancelling =
    String(normalizedSession.therapistId) === String(req.user.id);

  if (!isUserCancelling && !isTherapistCancelling) {
    throw new ApiError(403, 'Not authorized to cancel this session');
  }

  if (isTherapistCancelling && !cancelReason) {
    throw new ApiError(400, 'Cancellation reason is required when therapist cancels');
  }

  const cancelledSession = await Session.findOneAndUpdate(
    {
      _id: normalizedSession._id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
      ...(isUserCancelling ? { userId: req.user.id } : { therapistId: req.user.id }),
    },
    {
      $set: {
        ...buildCancellationFields({
          cancelledBy: isUserCancelling ? 'user' : 'therapist',
          reason: cancelReason,
        }),
      },
    },
    { returnDocument: 'after' }
  );

  if (!cancelledSession) {
    const latestSession = await Session.findById(normalizedSession._id);
    throw new ApiError(
      409,
      `Booking cannot be cancelled because it is already in '${latestSession?.status}' state.`
    );
  }

  const notifyUserId = isUserCancelling
    ? cancelledSession.therapistId
    : cancelledSession.userId;

  notificationService
    .notifySessionCancelled(notifyUserId, cancelledSession._id, cancelReason)
    .catch((error) => {
      logSessionSideEffectError('notifySessionCancelled', error);
    });

  emitSessionUpdateEvent(cancelledSession, 'session_cancelled');
  emitSlotUpdateEvent(cancelledSession, 'released');

  res.json(new ApiResponse(200, { session: cancelledSession }, 'Session cancelled successfully'));
});

/**
 * @desc    Stream realtime session/slot updates (SSE)
 * @route   GET /api/sessions/stream
 * @access  Private (Bearer token header or token query param)
 */
exports.streamSessionEvents = async (req, res, next) => {
  try {
    const user = await resolveAuthenticatedUser(req);
    realtimeService.subscribe(req, res, user);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401 && !res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();
      res.write('event: auth.error\n');
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
      return;
    }

    next(error);
  }
};
