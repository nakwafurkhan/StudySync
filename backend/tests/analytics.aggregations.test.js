const mongoose = require('mongoose');
const db = require('./helpers/db');
const Subject = require('../src/models/Subject');
const StudySession = require('../src/models/StudySession');
const {
  hoursPerWeek,
  loggedHoursBySubject,
  sessionTotals,
} = require('../src/services/analytics.aggregations');

const userId = new mongoose.Types.ObjectId();

beforeAll(async () => db.connect());
afterEach(async () => db.clear());
afterAll(async () => db.close());

beforeEach(async () => {
  const calc = await Subject.create({ userId, name: 'Calculus', deadline: '2026-07-01' });
  const bio = await Subject.create({ userId, name: 'Biology', deadline: '2026-07-10' });
  await StudySession.create([
    { userId, subjectId: calc._id, date: new Date('2026-06-16T10:00:00Z'), durationMinutes: 60 },
    { userId, subjectId: calc._id, date: new Date('2026-06-15T10:00:00Z'), durationMinutes: 30 },
    { userId, subjectId: bio._id, date: new Date('2026-06-09T10:00:00Z'), durationMinutes: 120 },
  ]);
});

describe('analytics aggregation pipelines', () => {
  it('hoursPerWeek buckets minutes into weeks', async () => {
    const rows = await hoursPerWeek(userId.toString());
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const total = rows.reduce((s, r) => s + r.hours, 0);
    expect(total).toBeCloseTo(3.5, 1); // (60 + 30 + 120) / 60
  });

  it('loggedHoursBySubject groups and looks up subject names', async () => {
    const rows = await loggedHoursBySubject(userId.toString());
    const map = Object.fromEntries(rows.map((r) => [r.subject, r.hours]));
    expect(map.Calculus).toBeCloseTo(1.5, 2);
    expect(map.Biology).toBeCloseTo(2, 2);
  });

  it('sessionTotals returns totals, today minutes, and distinct days', async () => {
    const totals = await sessionTotals(userId.toString(), new Date('2026-06-16T12:00:00Z'));
    expect(totals.totalMinutes).toBe(210);
    expect(totals.totalSessions).toBe(3);
    expect(totals.todayMinutes).toBe(60);
    expect([...totals.days].sort()).toEqual(['2026-06-09', '2026-06-15', '2026-06-16']);
  });
});
