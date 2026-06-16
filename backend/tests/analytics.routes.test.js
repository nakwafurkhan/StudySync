jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const groqClient = require('../src/services/groqClient');

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

describe('Analytics API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/analytics/summary')).statusCode).toBe(401);
  });

  it('returns a computed summary from subjects, plan and sessions', async () => {
    groqClient.createChatCompletion.mockResolvedValue(
      JSON.stringify({ days: [{ date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] }] })
    );
    const agent = await authedAgent();
    const subjectRes = await agent
      .post('/api/subjects')
      .send({ name: 'Calculus', deadline: '2026-06-20', priority: 'high' });
    const subjectId = subjectRes.body.subject._id;

    await agent.post('/api/schedule/generate').send({ dailyHours: 2, startDate: '2026-06-16' });
    await agent.post('/api/sessions').send({ subjectId, durationMinutes: 60, date: '2026-06-16' });

    const res = await agent.get('/api/analytics/summary');
    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalSessions).toBe(1);
    expect(res.body.summary.totalHours).toBe(1);

    const calc = res.body.summary.perSubject.find((s) => s.subject === 'Calculus');
    expect(calc.loggedHours).toBe(1);
    expect(calc.plannedHours).toBeGreaterThan(0);
    expect(res.body.summary.upcomingDeadlines.length).toBe(1);
  });

  it('returns an empty-but-valid summary for a new user', async () => {
    const agent = await authedAgent('fresh@example.com');
    const res = await agent.get('/api/analytics/summary');
    expect(res.statusCode).toBe(200);
    expect(res.body.summary.totalSessions).toBe(0);
    expect(res.body.summary.perSubject).toEqual([]);
  });
});
