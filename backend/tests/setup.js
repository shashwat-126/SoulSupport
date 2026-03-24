/**
 * Jest Setup File
 */

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-testing-purposes-only";
process.env.JWT_EXPIRES_IN = "7d";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/soulsupport-test";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
process.env.EMAIL_USER = "test@example.com";
process.env.EMAIL_PASS = "test-password";

jest.setTimeout(10000);

global.generateMockId = () => Math.random().toString(36).substr(2, 9);
global.generateMockEmail = () => `test${Date.now()}@example.com`;

if (process.env.DEBUG !== "true") {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}
