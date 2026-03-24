/**
 * Protected Routes Tests
 */

const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const User = require("../src/models/User.model");

describe("Protected Routes", () => {
  let token;
  let userId;
  let testUser;

  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    testUser = {
      email: "user@example.com",
      password: "Test1234!",
      fullName: "Test User",
      userType: "user",
    };

    const user = await User.create(testUser);
    userId = user._id.toString();

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    token = loginRes.body.data.token;
  });

  afterAll(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  });

  describe("GET /api/users/:id", () => {
    it("should get own user profile", async () => {
      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it("should not access other user profile", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "Test1234!",
        fullName: "Other User",
        userType: "user",
      });

      const res = await request(app)
        .get(`/api/users/${otherUser._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should reject without token", async () => {
      const res = await request(app).get(`/api/users/${userId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/users/:id", () => {
    it("should update own profile", async () => {
      const res = await request(app)
        .put(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          fullName: "Updated Name",
          bio: "Updated bio",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.fullName).toBe("Updated Name");
    });

    it("should not update other user profile", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "Test1234!",
        fullName: "Other User",
        userType: "user",
      });

      const res = await request(app)
        .put(`/api/users/${otherUser._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ fullName: "Hacked Name" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/users/:id", () => {
    it("should delete own account", async () => {
      const res = await request(app)
        .delete(`/api/users/${userId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    it("should not delete other user account", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "Test1234!",
        fullName: "Other User",
        userType: "user",
      });

      const res = await request(app)
        .delete(`/api/users/${otherUser._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/users/:id/stats", () => {
    it("should get own stats", async () => {
      const res = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
    });

    it("should not get other user stats", async () => {
      const otherUser = await User.create({
        email: "other@example.com",
        password: "Test1234!",
        fullName: "Other User",
        userType: "user",
      });

      const res = await request(app)
        .get(`/api/users/${otherUser._id}/stats`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
