const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');
const Session = require('../src/models/Session.model');
const TherapistProfile = require('../src/models/TherapistProfile.model');

const DEFAULT_PASSWORD = 'Test1234!';

async function createUser({ email, userType = 'user', fullName = 'Test User', bio = '' }) {
  return User.create({
    email,
    password: DEFAULT_PASSWORD,
    fullName,
    userType,
    bio,
  });
}

async function login(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: DEFAULT_PASSWORD });

  return res.body.data.token;
}

describe('API contract compatibility', () => {
  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    await Session.deleteMany({});
    await TherapistProfile.deleteMany({});
    await User.deleteMany({});
  });

  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  });

  it('exposes auth me payload fields at the top level', async () => {
    const user = await createUser({ email: 'compat-auth@example.com', fullName: 'Compat Auth User' });
    const token = await login(user.email);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(user.email);
    expect(res.body.user.email).toBe(user.email);
  });

  it('exposes profile settings at the top level', async () => {
    const user = await createUser({ email: 'compat-settings@example.com', fullName: 'Compat Settings User' });
    const token = await login(user.email);

    const res = await request(app)
      .get('/api/profile/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.settings.accountSummary.email).toBe(user.email);
    expect(res.body.settings.accountSummary.email).toBe(user.email);
  });

  it('exposes sessions list fields at the top level', async () => {
    const therapist = await createUser({
      email: 'compat-sessions-therapist@example.com',
      userType: 'therapist',
      fullName: 'Compat Therapist',
    });
    const user = await createUser({ email: 'compat-sessions-user@example.com', fullName: 'Compat Session User' });
    const token = await login(user.email);

    await Session.create({
      therapistId: therapist._id,
      userId: user._id,
      therapist: { name: therapist.fullName },
      user: { name: user.fullName, email: user.email },
      sessionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      status: 'pending',
    });

    const res = await request(app)
      .get('/api/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.sessions)).toBe(true);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions).toHaveLength(1);
  });

  it('exposes available slot fields at the top level', async () => {
    const therapist = await createUser({
      email: 'compat-slots-therapist@example.com',
      userType: 'therapist',
      fullName: 'Compat Slots Therapist',
    });

    await TherapistProfile.create({
      userId: therapist._id,
      qualifications: 'Licensed Therapist',
      hourlyRate: 150,
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timeStart: '09:00',
        timeEnd: '17:00',
      },
    });

    const targetDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    const res = await request(app)
      .get(`/api/sessions/available-slots/${therapist._id}`)
      .query({ date: `${yyyy}-${mm}-${dd}` });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.availableHours)).toBe(true);
    expect(Array.isArray(res.body.availableHours)).toBe(true);
  });

  it('returns therapist self-profile in both wrapped and flat-compatible forms', async () => {
    const therapist = await createUser({
      email: 'compat-therapist@example.com',
      userType: 'therapist',
      fullName: 'Compat Therapist Profile',
      bio: 'Therapist bio',
    });
    const token = await login(therapist.email);

    await TherapistProfile.create({
      userId: therapist._id,
      qualifications: 'Licensed Therapist',
      hourlyRate: 120,
      specializations: ['anxiety'],
    });

    const res = await request(app)
      .get('/api/therapists/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.therapist.user.fullName).toBe(therapist.fullName);
    expect(res.body.therapist.user.fullName).toBe(therapist.fullName);
    expect(res.body.data.specializations).toEqual(['anxiety']);
  });
});