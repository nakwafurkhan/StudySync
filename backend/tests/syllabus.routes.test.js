jest.mock('../src/services/groqClient', () => ({
  createChatCompletion: jest.fn(),
  getClient: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');
const groqClient = require('../src/services/groqClient');

const validJson = JSON.stringify({
  course: 'CS101',
  items: [
    { title: 'Midterm', type: 'exam', dueDate: '2026-07-01', weightPercent: 30 },
    { title: 'Final', type: 'exam', dueDate: '2026-08-01', weightPercent: 40 },
  ],
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

describe('Syllabus parse', () => {
  it('requires authentication', async () => {
    expect((await request(app).post('/api/syllabus/parse').send({ text: 'x' })).statusCode).toBe(401);
  });

  it('extracts items from pasted text', async () => {
    groqClient.createChatCompletion.mockResolvedValue(validJson);
    const agent = await authedAgent();
    const res = await agent.post('/api/syllabus/parse').send({ text: 'Midterm July 1 (30%), Final Aug 1 (40%)' });
    expect(res.statusCode).toBe(200);
    expect(res.body.course).toBe('CS101');
    expect(res.body.items).toHaveLength(2);
  });

  it('400 when no input is provided', async () => {
    const agent = await authedAgent();
    expect((await agent.post('/api/syllabus/parse').send({})).statusCode).toBe(400);
  });

  it('502 when the model cannot produce valid output', async () => {
    groqClient.createChatCompletion.mockResolvedValue('not json at all');
    const agent = await authedAgent();
    const res = await agent.post('/api/syllabus/parse').send({ text: 'unparseable' });
    expect(res.statusCode).toBe(502);
  });
});

describe('Syllabus import', () => {
  it('bulk-creates calendar events from items', async () => {
    const agent = await authedAgent();
    const res = await agent.post('/api/syllabus/import').send({
      course: 'CS101',
      items: [
        { title: 'Midterm', type: 'exam', dueDate: '2026-07-01', weightPercent: 30 },
        { title: 'No date', type: 'assignment', dueDate: null },
      ],
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.created).toBe(1); // the dateless item is skipped

    const cal = await agent.get('/api/calendar');
    const saved = cal.body.events.filter((e) => !e.derived);
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe('CS101: Midterm');
    expect(saved[0].weightPercent).toBe(30);
  });

  it('400 when no items have valid dates', async () => {
    const agent = await authedAgent();
    const res = await agent.post('/api/syllabus/import').send({ items: [{ title: 'X', dueDate: null }] });
    expect(res.statusCode).toBe(400);
  });
});
