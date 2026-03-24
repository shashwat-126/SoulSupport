const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');
const Session = require('../src/models/Session.model');
const SlotHold = require('../src/models/SlotHold.model');
const Review = require('../src/models/Review.model');
const TherapistProfile = require('../src/models/TherapistProfile.model');

const DEFAULT_PASSWORD = 'Test1234!';

async function createUser({ email, userType = 'user', fullName = 'Test User' }) {
  return User.create({
    email,
    password: DEFAULT_PASSWORD,
    fullName,
    userType,
  });
}

async function login(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: DEFAULT_PASSWORD });

  return res.body.data.token;
}

describe('Session Security and Review Edge Cases', () => {
  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    await SlotHold.deleteMany({});
    await Session.deleteMany({});
    await TherapistProfile.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  });

  describe('Meeting window access guard', () => {
    it('allows booked user access only within session window', async () => {
      const therapist = await createUser({
        email: 'therapist-meeting@example.com',
        userType: 'therapist',
        fullName: 'Meeting Therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 100,
      });

      const user = await createUser({
        email: 'user-meeting@example.com',
        userType: 'user',
        fullName: 'Meeting User',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(),
        durationMinutes: 60,
        status: 'confirmed',
        meetingRoomId: 'soulsupport-session-test-room',
        meetingLink: 'https://meet.jit.si/soulsupport-session-test-room',
      });

      const userToken = await login(user.email);

      const res = await request(app)
        .get(`/api/sessions/${session._id}/meeting`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meetingLink).toBeDefined();
      expect(res.body.data.meetingRoomId).toBeDefined();
    });

    it('rejects meeting access for non-participants', async () => {
      const therapist = await createUser({
        email: 'therapist-outsider@example.com',
        userType: 'therapist',
        fullName: 'Outsider Therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 120,
      });

      const user = await createUser({
        email: 'user-outsider@example.com',
        userType: 'user',
      });

      const outsider = await createUser({
        email: 'outsider@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(),
        durationMinutes: 60,
        status: 'confirmed',
        meetingRoomId: 'soulsupport-session-outsider-room',
        meetingLink: 'https://meet.jit.si/soulsupport-session-outsider-room',
      });

      const outsiderToken = await login(outsider.email);

      const res = await request(app)
        .get(`/api/sessions/${session._id}/meeting`)
        .set('Authorization', `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(String(res.body.error)).toContain('Only booked users can access meeting page');
    });

    it('rejects meeting access outside allowed session window', async () => {
      const therapist = await createUser({
        email: 'therapist-window@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 150,
      });

      const user = await createUser({
        email: 'user-window@example.com',
        userType: 'user',
      });

      const sessionDateTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: sessionDateTomorrow,
        durationMinutes: 60,
        status: 'confirmed',
        meetingRoomId: 'soulsupport-session-window-room',
        meetingLink: 'https://meet.jit.si/soulsupport-session-window-room',
      });

      const userToken = await login(user.email);

      const res = await request(app)
        .get(`/api/sessions/${session._id}/meeting`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(String(res.body.error)).toContain('Meeting link accessible only during session window');
    });
  });

  describe('Double booking and slot locking', () => {
    it('blocks other users while a slot is in active hold state', async () => {
      const therapist = await createUser({
        email: 'therapist-hold-lock@example.com',
        userType: 'therapist',
      });

      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 120,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeStart: '09:00',
          timeEnd: '18:00',
        },
      });

      const userA = await createUser({ email: 'hold-user-a@example.com', userType: 'user' });
      const userB = await createUser({ email: 'hold-user-b@example.com', userType: 'user' });
      const tokenA = await login(userA.email);
      const tokenB = await login(userB.email);

      const slotDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
      slotDate.setHours(11, 0, 0, 0);

      const holdA = await request(app)
        .post('/api/sessions/holds')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ therapistId: therapist._id.toString(), sessionDate: slotDate.toISOString() });

      expect(holdA.status).toBe(201);
      expect(holdA.body.data.hold.status).toBe('active');

      const holdB = await request(app)
        .post('/api/sessions/holds')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ therapistId: therapist._id.toString(), sessionDate: slotDate.toISOString() });

      expect(holdB.status).toBe(409);
      expect(String(holdB.body.error)).toContain('currently held');
    });

    it('releases hold after expiry and allows another user to acquire the slot', async () => {
      const therapist = await createUser({
        email: 'therapist-hold-expiry@example.com',
        userType: 'therapist',
      });

      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 120,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeStart: '09:00',
          timeEnd: '18:00',
        },
      });

      const userA = await createUser({ email: 'hold-expiry-user-a@example.com', userType: 'user' });
      const userB = await createUser({ email: 'hold-expiry-user-b@example.com', userType: 'user' });
      const tokenA = await login(userA.email);
      const tokenB = await login(userB.email);

      const slotDate = new Date(Date.now() + 72 * 60 * 60 * 1000);
      slotDate.setHours(12, 0, 0, 0);

      const holdA = await request(app)
        .post('/api/sessions/holds')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ therapistId: therapist._id.toString(), sessionDate: slotDate.toISOString() });

      expect(holdA.status).toBe(201);

      await SlotHold.updateOne(
        { _id: holdA.body.data.hold._id },
        { $set: { expiresAt: new Date(Date.now() - 60 * 1000) } }
      );

      const holdB = await request(app)
        .post('/api/sessions/holds')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ therapistId: therapist._id.toString(), sessionDate: slotDate.toISOString() });

      expect(holdB.status).toBe(201);
      expect(holdB.body.data.hold.status).toBe('active');
      expect(String(holdB.body.data.hold.userId)).toBe(String(userB._id));
    });

    it('allows only one booking when two users race for the same slot', async () => {
      const therapist = await createUser({
        email: 'therapist-race-booking@example.com',
        userType: 'therapist',
      });

      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 100,
        availability: {
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          timeStart: '09:00',
          timeEnd: '18:00',
        },
      });

      const userA = await createUser({
        email: 'user-race-booking-a@example.com',
        userType: 'user',
      });

      const userB = await createUser({
        email: 'user-race-booking-b@example.com',
        userType: 'user',
      });

      const tokenA = await login(userA.email);
      const tokenB = await login(userB.email);

      const sessionDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      sessionDate.setHours(10, 0, 0, 0);

      const payload = {
        therapistId: therapist._id.toString(),
        sessionDate: sessionDate.toISOString(),
        durationMinutes: 60,
      };

      const [resultA, resultB] = await Promise.all([
        request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenA}`).send(payload),
        request(app).post('/api/sessions').set('Authorization', `Bearer ${tokenB}`).send(payload),
      ]);

      const statuses = [resultA.status, resultB.status].sort();
      expect(statuses).toEqual([201, 409]);

      const activeSessions = await Session.find({
        therapistId: therapist._id,
        sessionDate,
        status: { $in: ['pending', 'confirmed'] },
      });

      expect(activeSessions).toHaveLength(1);
      const winnerUserId = String(activeSessions[0].userId);
      expect([String(userA._id), String(userB._id)]).toContain(winnerUserId);
    });
  });

  describe('Completion-status reconciliation logic', () => {
    it('marks session completed only after both user and therapist submit completed', async () => {
      const therapist = await createUser({
        email: 'therapist-complete@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 90,
      });

      const user = await createUser({
        email: 'user-complete@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'confirmed',
        meetingRoomId: 'soulsupport-session-complete-room',
        meetingLink: 'https://meet.jit.si/soulsupport-session-complete-room',
      });

      const userToken = await login(user.email);
      const therapistToken = await login(therapist.email);

      const userRes = await request(app)
        .put(`/api/sessions/${session._id}/completion-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'completed' });

      expect(userRes.status).toBe(200);
      expect(userRes.body.data.session.sessionStatusUser).toBe('completed');
      expect(userRes.body.data.session.status).toBe('confirmed');

      const therapistRes = await request(app)
        .put(`/api/sessions/${session._id}/completion-status`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'completed' });

      expect(therapistRes.status).toBe(200);
      expect(therapistRes.body.data.session.sessionStatusTherapist).toBe('completed');
      expect(therapistRes.body.data.session.status).toBe('completed');
      expect(therapistRes.body.data.session.meetingStatus).toBe('completed');
    });

    it('requires cancellation reason when cancelled and reconciles to cancelled_by_user', async () => {
      const therapist = await createUser({
        email: 'therapist-cancel@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 80,
      });

      const user = await createUser({
        email: 'user-cancel@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'confirmed',
      });

      const userToken = await login(user.email);

      const missingReason = await request(app)
        .put(`/api/sessions/${session._id}/completion-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'cancelled_by_user' });

      expect(missingReason.status).toBe(400);
      expect(String(missingReason.body.error)).toContain('Cancellation reason is required');

      const withReason = await request(app)
        .put(`/api/sessions/${session._id}/completion-status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'cancelled_by_user', cancellationReason: 'Technical issues' });

      expect(withReason.status).toBe(200);
      expect(withReason.body.data.session.status).toBe('cancelled_by_user');
      expect(withReason.body.data.session.sessionStatusUser).toBe('cancelled');
      expect(withReason.body.data.session.cancellationReasonUser).toBe('Technical issues');
    });

    it('blocks therapist confirm after user cancellation with explicit error', async () => {
      const therapist = await createUser({
        email: 'therapist-cancelled-confirm@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 120,
      });

      const user = await createUser({
        email: 'user-cancelled-confirm@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'pending',
      });

      const userToken = await login(user.email);
      const therapistToken = await login(therapist.email);

      const cancelRes = await request(app)
        .delete(`/api/sessions/${session._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ cancelReason: 'User unavailable' });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.session.status).toBe('cancelled_by_user');

      const confirmRes = await request(app)
        .put(`/api/sessions/${session._id}/status`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({ status: 'confirmed' });

      expect(confirmRes.status).toBe(409);
      expect(String(confirmRes.body.error)).toContain('already been cancelled by the user');
    });

    it('prevents duplicate/crossed cancellation updates from pending state', async () => {
      const therapist = await createUser({
        email: 'therapist-race-cancel@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 140,
      });

      const user = await createUser({
        email: 'user-race-cancel@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'pending',
      });

      const userToken = await login(user.email);
      const therapistToken = await login(therapist.email);

      const firstCancel = await request(app)
        .delete(`/api/sessions/${session._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ cancelReason: 'User unavailable' });

      expect(firstCancel.status).toBe(200);
      expect(firstCancel.body.data.session.status).toBe('cancelled_by_user');

      const secondCancel = await request(app)
        .put(`/api/sessions/${session._id}/status`)
        .set('Authorization', `Bearer ${therapistToken}`)
        .send({
          status: 'cancelled_by_therapist',
          cancelReason: 'Therapist unavailable',
        });

      expect(secondCancel.status).toBe(409);

      const latest = await Session.findById(session._id);
      expect(latest.status).toBe('cancelled_by_user');
      expect(latest.meetingRoomId).toBeFalsy();
      expect(latest.meetingLink).toBeFalsy();
    });
  });

  describe('Review eligibility and duplicate prevention', () => {
    it('rejects review when session is not fully completed by both participants', async () => {
      const therapist = await createUser({
        email: 'therapist-review-ineligible@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 95,
      });

      const user = await createUser({
        email: 'user-review-ineligible@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'completed',
        sessionStatusUser: 'completed',
        sessionStatusTherapist: 'pending',
      });

      const userToken = await login(user.email);

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: session._id.toString(),
          rating: 5,
          reviewTitle: 'Great support',
          comment: 'Very helpful session.',
        });

      expect(res.status).toBe(400);
      expect(String(res.body.error)).toContain('fully completed');
    });

    it('allows one review for eligible session and blocks duplicates for same session', async () => {
      const therapist = await createUser({
        email: 'therapist-review-eligible@example.com',
        userType: 'therapist',
      });
      await TherapistProfile.create({
        userId: therapist._id,
        qualifications: 'Licensed Therapist',
        hourlyRate: 110,
      });

      const user = await createUser({
        email: 'user-review-eligible@example.com',
        userType: 'user',
      });

      const session = await Session.create({
        therapistId: therapist._id,
        userId: user._id,
        sessionDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: 'completed',
        sessionStatusUser: 'completed',
        sessionStatusTherapist: 'completed',
      });

      const userToken = await login(user.email);

      const first = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: session._id.toString(),
          rating: 4,
          reviewTitle: 'Solid session',
          comment: 'Good outcomes and practical steps.',
        });

      expect(first.status).toBe(201);
      expect(first.body.success).toBe(true);

      const duplicate = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sessionId: session._id.toString(),
          rating: 5,
          reviewTitle: 'Second attempt',
          comment: 'This should not be accepted.',
        });

      expect(duplicate.status).toBe(400);
      expect(String(duplicate.body.error)).toContain('Review already exists');
    });
  });
});
