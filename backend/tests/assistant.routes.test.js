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

describe('Assistant API', () => {
  it('requires authentication', async () => {
    expect((await request(app).post('/api/assistant/chat').send({ message: 'hi' })).statusCode).toBe(401);
  });

  it('returns 400 without a user message', async () => {
    const agent = await authedAgent();
    expect((await agent.post('/api/assistant/chat').send({ messages: [] })).statusCode).toBe(400);
  });

  it('returns a grounded reply', async () => {
    groqClient.createChatCompletion.mockResolvedValue('Start with Statistics — the final is soon.');
    const agent = await authedAgent();
    await agent.post('/api/subjects').send({ name: 'Statistics', deadline: '2026-07-01', priority: 'high' });

    const res = await agent
      .post('/api/assistant/chat')
      .send({ messages: [{ role: 'user', content: 'What should I study first?' }] });
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toMatch(/Statistics/);
  });

  it('returns 502 when the model fails', async () => {
    groqClient.createChatCompletion.mockRejectedValue(new Error('down'));
    const agent = await authedAgent();
    const res = await agent.post('/api/assistant/chat').send({ message: 'hi' });
    expect(res.statusCode).toBe(502);
  });
});
