const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const User = require('../src/models/User');

const validUser = {
  name: 'Tess Tudent',
  email: 'tess@example.com',
  password: 'password123',
};

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  await db.connect();
});
afterEach(async () => db.clear());
afterAll(async () => db.close());

describe('POST /api/auth/register', () => {
  it('creates a user, sets the auth cookie, and hides the password hash', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(validUser.email);
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect((res.headers['set-cookie'] || []).join(';')).toMatch(/token=/);

    const stored = await User.findOne({ email: validUser.email }).select('+passwordHash');
    expect(stored.passwordHash).toBeDefined();
    expect(stored.passwordHash).not.toBe(validUser.password);
  });

  it('rejects a short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);
    const res = await request(app).post('/api/auth/register').send(validUser);
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validUser);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
    expect((res.headers['set-cookie'] || []).join(';')).toMatch(/token=/);
  });

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validUser.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects an unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.statusCode).toBe(401);
  });

  it('responds 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: validUser.email });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/auth/me & POST /api/auth/logout', () => {
  it('responds 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns the current user with a valid session cookie', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser);
    const res = await agent.get('/api/auth/me');
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(validUser.email);
  });

  it('logout clears the cookie so /me is unauthorized again', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(validUser);
    const out = await agent.post('/api/auth/logout');
    expect(out.statusCode).toBe(200);
    const me = await agent.get('/api/auth/me');
    expect(me.statusCode).toBe(401);
  });
});
