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

describe('Subjects API', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/subjects');
    expect(res.statusCode).toBe(401);
  });

  it('creates and lists subjects for the owner', async () => {
    const agent = await authedAgent();
    const created = await agent
      .post('/api/subjects')
      .send({ name: 'Calculus', deadline: '2026-07-01', priority: 'high' });
    expect(created.statusCode).toBe(201);
    expect(created.body.subject.name).toBe('Calculus');
    expect(created.body.subject.priority).toBe('high');

    const list = await agent.get('/api/subjects');
    expect(list.statusCode).toBe(200);
    expect(list.body.subjects).toHaveLength(1);
  });

  it('defaults priority to medium', async () => {
    const agent = await authedAgent();
    const res = await agent.post('/api/subjects').send({ name: 'History', deadline: '2026-09-01' });
    expect(res.body.subject.priority).toBe('medium');
  });

  it('rejects a missing name or invalid deadline with 400', async () => {
    const agent = await authedAgent();
    expect((await agent.post('/api/subjects').send({ deadline: '2026-07-01' })).statusCode).toBe(400);
    expect((await agent.post('/api/subjects').send({ name: 'X', deadline: 'nope' })).statusCode).toBe(400);
  });

  it('updates an owned subject', async () => {
    const agent = await authedAgent();
    const { body } = await agent.post('/api/subjects').send({ name: 'Bio', deadline: '2026-07-01' });
    const res = await agent
      .put(`/api/subjects/${body.subject._id}`)
      .send({ name: 'Biology', priority: 'high' });
    expect(res.statusCode).toBe(200);
    expect(res.body.subject.name).toBe('Biology');
    expect(res.body.subject.priority).toBe('high');
  });

  it('deletes an owned subject', async () => {
    const agent = await authedAgent();
    const { body } = await agent.post('/api/subjects').send({ name: 'Chem', deadline: '2026-07-01' });
    const del = await agent.delete(`/api/subjects/${body.subject._id}`);
    expect(del.statusCode).toBe(200);
    const list = await agent.get('/api/subjects');
    expect(list.body.subjects).toHaveLength(0);
  });

  it("cannot modify another user's subject", async () => {
    const a = await authedAgent('a@example.com');
    const b = await authedAgent('b@example.com');
    const { body } = await a.post('/api/subjects').send({ name: 'Secret', deadline: '2026-07-01' });

    const upd = await b.put(`/api/subjects/${body.subject._id}`).send({ name: 'Hacked' });
    expect(upd.statusCode).toBe(404);
    const del = await b.delete(`/api/subjects/${body.subject._id}`);
    expect(del.statusCode).toBe(404);

    // A still owns the unchanged subject.
    const list = await a.get('/api/subjects');
    expect(list.body.subjects[0].name).toBe('Secret');
  });

  it('returns 404 for an invalid id', async () => {
    const agent = await authedAgent();
    expect((await agent.put('/api/subjects/not-an-id').send({ name: 'x' })).statusCode).toBe(404);
    expect((await agent.delete('/api/subjects/not-an-id')).statusCode).toBe(404);
  });
});
