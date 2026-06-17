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

describe('Calendar API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/calendar')).statusCode).toBe(401);
  });

  it('creates and lists events', async () => {
    const agent = await authedAgent();
    const created = await agent
      .post('/api/calendar')
      .send({ title: 'Midterm', type: 'exam', date: '2026-07-01', weightPercent: 30 });
    expect(created.statusCode).toBe(201);
    expect(created.body.event.type).toBe('exam');

    const list = await agent.get('/api/calendar');
    expect(list.statusCode).toBe(200);
    expect(list.body.events).toHaveLength(1);
    expect(list.body.events[0].derived).toBe(false);
  });

  it('rejects an event with no title or bad date', async () => {
    const agent = await authedAgent();
    expect((await agent.post('/api/calendar').send({ type: 'exam', date: '2026-07-01' })).statusCode).toBe(400);
    expect((await agent.post('/api/calendar').send({ title: 'X', date: 'nope' })).statusCode).toBe(400);
  });

  it('filters by date range', async () => {
    const agent = await authedAgent();
    await agent.post('/api/calendar').send({ title: 'July', type: 'exam', date: '2026-07-15' });
    await agent.post('/api/calendar').send({ title: 'August', type: 'exam', date: '2026-08-15' });
    const july = await agent.get('/api/calendar?from=2026-07-01&to=2026-07-31');
    expect(july.body.events.filter((e) => !e.derived)).toHaveLength(1);
    expect(july.body.events[0].title).toBe('July');
  });

  it('overlays study-plan blocks as derived study events', async () => {
    groqClient.createChatCompletion.mockResolvedValue(
      JSON.stringify({ days: [{ date: '2026-06-20', blocks: [{ subject: 'Calculus', hours: 2 }] }] })
    );
    const agent = await authedAgent();
    await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01' });
    await agent.post('/api/schedule/generate').send({ dailyHours: 2, startDate: '2026-06-20' });

    const list = await agent.get('/api/calendar');
    const study = list.body.events.find((e) => e.type === 'study');
    expect(study).toBeDefined();
    expect(study.derived).toBe(true);
    expect(study.title).toMatch(/Calculus/);
  });

  it('deletes an owned event, 404 for others or invalid ids', async () => {
    const a = await authedAgent('a@example.com');
    const b = await authedAgent('b@example.com');
    const { body } = await a.post('/api/calendar').send({ title: 'Mine', type: 'exam', date: '2026-07-01' });

    expect((await b.delete(`/api/calendar/${body.event._id}`)).statusCode).toBe(404);
    expect((await a.delete('/api/calendar/not-an-id')).statusCode).toBe(404);
    expect((await a.delete(`/api/calendar/${body.event._id}`)).statusCode).toBe(200);
    expect((await a.get('/api/calendar')).body.events.filter((e) => !e.derived)).toHaveLength(0);
  });
});
