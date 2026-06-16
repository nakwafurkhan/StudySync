const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers/db');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  await db.connect();
});
afterEach(async () => db.clear());
afterAll(async () => db.close());

async function authedAgent(email = 'a@example.com') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ name: 'A', email, password: 'password123' });
  return agent;
}

async function createSubject(agent, name = 'Calculus') {
  const res = await agent.post('/api/subjects').send({ name, deadline: '2026-07-01' });
  return res.body.subject._id;
}

describe('Sessions API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/sessions')).statusCode).toBe(401);
  });

  it('logs a session and lists it (newest first, subject populated)', async () => {
    const agent = await authedAgent();
    const subjectId = await createSubject(agent);

    const created = await agent
      .post('/api/sessions')
      .send({ subjectId, durationMinutes: 45, notes: 'Reviewed limits', date: '2026-06-16' });
    expect(created.statusCode).toBe(201);
    expect(created.body.session.durationMinutes).toBe(45);
    expect(created.body.session.subjectId.name).toBe('Calculus');

    const list = await agent.get('/api/sessions');
    expect(list.statusCode).toBe(200);
    expect(list.body.sessions).toHaveLength(1);
    expect(list.body.sessions[0].notes).toBe('Reviewed limits');
  });

  it('defaults completed to true and date to now', async () => {
    const agent = await authedAgent();
    const subjectId = await createSubject(agent);
    const res = await agent.post('/api/sessions').send({ subjectId, durationMinutes: 20 });
    expect(res.statusCode).toBe(201);
    expect(res.body.session.completed).toBe(true);
    expect(res.body.session.date).toBeDefined();
  });

  it('rejects an invalid subjectId or non-positive duration with 400', async () => {
    const agent = await authedAgent();
    expect((await agent.post('/api/sessions').send({ subjectId: 'nope', durationMinutes: 30 })).statusCode).toBe(400);
    const subjectId = await createSubject(agent);
    expect((await agent.post('/api/sessions').send({ subjectId, durationMinutes: 0 })).statusCode).toBe(400);
  });

  it("rejects logging against another user's subject with 404", async () => {
    const a = await authedAgent('a@example.com');
    const b = await authedAgent('b@example.com');
    const subjectId = await createSubject(a, 'Private');
    const res = await b.post('/api/sessions').send({ subjectId, durationMinutes: 30 });
    expect(res.statusCode).toBe(404);
  });

  it('filters sessions by subjectId', async () => {
    const agent = await authedAgent();
    const calcId = await createSubject(agent, 'Calculus');
    const bioId = await createSubject(agent, 'Biology');
    await agent.post('/api/sessions').send({ subjectId: calcId, durationMinutes: 30 });
    await agent.post('/api/sessions').send({ subjectId: bioId, durationMinutes: 60 });

    const filtered = await agent.get(`/api/sessions?subjectId=${bioId}`);
    expect(filtered.body.sessions).toHaveLength(1);
    expect(filtered.body.sessions[0].subjectId.name).toBe('Biology');
  });
});
