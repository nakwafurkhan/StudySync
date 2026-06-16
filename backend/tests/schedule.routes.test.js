jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const groqClient = require('../src/services/groqClient');

const validSchedule = JSON.stringify({
  days: [{ date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] }],
});

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  await db.connect();
});
afterEach(async () => {
  await db.clear();
  jest.clearAllMocks();
});
afterAll(async () => db.close());

async function authedAgent(email = 'a@example.com') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ name: 'A', email, password: 'password123' });
  return agent;
}

describe('Schedule API', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/schedule/generate').send({ dailyHours: 3 });
    expect(res.statusCode).toBe(401);
  });

  it('returns 400 when dailyHours is missing or invalid', async () => {
    const agent = await authedAgent();
    await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01' });
    expect((await agent.post('/api/schedule/generate').send({})).statusCode).toBe(400);
    expect((await agent.post('/api/schedule/generate').send({ dailyHours: -2 })).statusCode).toBe(400);
  });

  it('returns 400 when the user has no subjects', async () => {
    const agent = await authedAgent();
    const res = await agent.post('/api/schedule/generate').send({ dailyHours: 3 });
    expect(res.statusCode).toBe(400);
  });

  it('generates and saves a plan from the user subjects', async () => {
    groqClient.createChatCompletion.mockResolvedValue(validSchedule);
    const agent = await authedAgent();
    await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01', priority: 'high' });

    const res = await agent.post('/api/schedule/generate').send({ dailyHours: 3, startDate: '2026-06-17' });
    expect(res.statusCode).toBe(201);
    expect(res.body.plan.source).toBe('groq');
    expect(res.body.plan.generatedSchedule.days[0].blocks[0].subject).toBe('Calculus');
    expect(res.body.plan.dailyHours).toBe(3);
  });

  it('falls back gracefully when the model returns junk', async () => {
    groqClient.createChatCompletion.mockResolvedValue('not json at all');
    const agent = await authedAgent();
    await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01' });

    const res = await agent.post('/api/schedule/generate').send({ dailyHours: 3 });
    expect(res.statusCode).toBe(201);
    expect(res.body.plan.source).toBe('fallback');
    expect(res.body.plan.generatedSchedule.days.length).toBeGreaterThan(0);
  });

  it('GET /current returns 404 then the latest plan', async () => {
    groqClient.createChatCompletion.mockResolvedValue(validSchedule);
    const agent = await authedAgent();
    expect((await agent.get('/api/schedule/current')).statusCode).toBe(404);

    await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01' });
    await agent.post('/api/schedule/generate').send({ dailyHours: 3 });

    const cur = await agent.get('/api/schedule/current');
    expect(cur.statusCode).toBe(200);
    expect(cur.body.plan.generatedSchedule.days.length).toBeGreaterThan(0);
  });
});
