/**
 * App-level tests that exercise the express app via supertest
 * but do NOT touch the database. We never call mongoose.connect.
 *
 * These verify the parts of the request pipeline that work without
 * a DB: health check, 404 handler, CORS headers, security headers,
 * body parser limits, and the global error envelope shape.
 */

const request = require('supertest');
const app = require('../src/app');

describe('App pipeline (no DB)', () => {
  describe('GET /health', () => {
    it('returns 200 with status OK', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
      expect(typeof res.body.timestamp).toBe('string');
    });
  });

  describe('Unknown routes', () => {
    it('returns 404 with the standard error envelope', async () => {
      const res = await request(app).get('/api/this-route-does-not-exist');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Route not found');
    });
  });

  describe('Security headers', () => {
    it('sets helmet defaults', async () => {
      const res = await request(app).get('/health');
      // helmet sets X-Content-Type-Options and a few others by default
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-dns-prefetch-control']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('echoes Access-Control-Allow-Origin for an allowed localhost origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('echoes Access-Control-Allow-Origin for the allowed production origin', async () => {
      const res = await request(app)
      .get('/health')
      .set('Origin', 'https://soul-support-hazel.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBe('https://soul-support-hazel.vercel.app');
   });
    it('does not set Access-Control-Allow-Origin for disallowed origins', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('responds 204 to preflight OPTIONS for allowed origin', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');
      expect(res.status).toBe(204);
    });
  });

  describe('Body parser limits', () => {
    it('rejects oversize JSON bodies with a non-2xx status', async () => {
      const huge = 'x'.repeat(3 * 1024 * 1024); // 3 MB > 2 MB limit
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ blob: huge });
      // The exact status varies (413/400/500) depending on how express
      // surfaces the PayloadTooLargeError. The contract we care about is
      // that the body never reaches the handler successfully.
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
