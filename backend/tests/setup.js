/**
 * Jest Setup File
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test';
process.env.JWT_EXPIRES_IN = '7d';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soulsupport-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test';
process.env.EMAIL_DISABLE = 'true';

jest.setTimeout(10000);

global.generateMockId = () => Math.random().toString(36).substr(2, 9);
global.generateMockEmail = () => `test${Date.now()}@example.com`;

if (process.env.DEBUG !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}