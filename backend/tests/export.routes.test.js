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

describe('Export API', () => {
  it('requires authentication', async () => {
    expect((await request(app).get('/api/export/sessions.csv')).statusCode).toBe(401);
  });

  it('exports sessions as CSV', async () => {
    const agent = await authedAgent();
    const subj = await agent.post('/api/subjects').send({ name: 'Calculus', deadline: '2026-07-01' });
    await agent
      .post('/api/sessions')
      .send({ subjectId: subj.body.subject._id, durationMinutes: 45, date: '2026-06-16' });

    const res = await agent.get('/api/export/sessions.csv');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.text).toMatch(/Date,Subject,Minutes,Completed,Notes/);
    expect(res.text).toMatch(/Calculus/);
    expect(res.text).toMatch(/45/);
  });

  it('exports the calendar as CSV', async () => {
    const agent = await authedAgent();
    await agent.post('/api/calendar').send({ title: 'Midterm', type: 'exam', date: '2026-07-01', weightPercent: 30 });

    const res = await agent.get('/api/export/calendar.csv');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toMatch(/Midterm/);
    expect(res.text).toMatch(/exam/);
  });

  it('exports a PDF report', async () => {
    const agent = await authedAgent();
    const res = await agent.get('/api/export/report.pdf').buffer();
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/studysync-report\.pdf/);
  });
});
