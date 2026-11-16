const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const db = require('./helpers/db');

beforeAll(() => db.connect());
afterAll(() => db.close());
afterEach(() => { app.locals.draining = false; delete process.env.METRICS_TOKEN; jest.restoreAllMocks(); });

test('readiness verifies the DB and fails while draining or on ping failure', async () => {
  expect((await request(app).get('/api/health/ready')).status).toBe(200);
  app.locals.draining = true;
  expect((await request(app).get('/api/health/ready')).status).toBe(503);
  app.locals.draining = false;
  jest.spyOn(mongoose.connection.db, 'admin').mockReturnValue({ ping: async () => { throw new Error('offline'); } });
  expect((await request(app).get('/api/health/ready')).status).toBe(503);
  expect((await request(app).get('/api/health')).status).toBe(200);
});

test('metrics require a token and do not expose arbitrary request paths', async () => {
  expect((await request(app).get('/metrics')).status).toBe(404);
  process.env.METRICS_TOKEN = 'metrics-test';
  expect((await request(app).get('/metrics').set('Authorization', 'Bearer wrong')).status).toBe(404);
  const response = await request(app).get('/private-user-path?secret=do-not-log');
  expect(response.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/);
  const metrics = await request(app).get('/metrics').set('Authorization', 'Bearer metrics-test');
  expect(metrics.status).toBe(200);
  expect(metrics.text).toContain('http_request_duration_seconds_count');
  expect(metrics.text).toContain('studysync_database_ready 1');
  expect(metrics.text).not.toContain('private-user-path');
  expect(metrics.text).not.toContain('do-not-log');
});
