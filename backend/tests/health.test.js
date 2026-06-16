const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns 200 with status ok and a db field', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('studysync-backend');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('uptime');
  });
});

describe('unknown routes', () => {
  it('returns 404 with a JSON message', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
