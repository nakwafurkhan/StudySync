const { buildSummary } = require('../src/services/analytics.service');

const now = new Date('2026-06-17T00:00:00Z');

const subjects = [
  { name: 'Calculus', deadline: '2026-06-20' }, // 3 days out
  { name: 'Biology', deadline: '2026-07-30' }, // far off
];

const sessions = [
  { subjectId: { name: 'Calculus' }, durationMinutes: 60, date: '2026-06-16' },
  { subjectId: { name: 'Calculus' }, durationMinutes: 30, date: '2026-06-15' },
  { subjectId: { name: 'Biology' }, durationMinutes: 120, date: '2026-06-09' },
];

const plan = {
  generatedSchedule: {
    days: [
      { date: '2026-06-16', blocks: [{ subject: 'Calculus', hours: 2 }, { subject: 'Biology', hours: 1 }] },
      { date: '2026-06-17', blocks: [{ subject: 'Calculus', hours: 2 }] },
    ],
  },
};

describe('buildSummary', () => {
  const summary = buildSummary({ subjects, sessions, plan, now });

  it('computes totals', () => {
    expect(summary.totalHours).toBe(3.5); // 210 min
    expect(summary.totalSessions).toBe(3);
  });

  it('aggregates hours per week', () => {
    const total = summary.hoursPerWeek.reduce((s, w) => s + w.hours, 0);
    expect(total).toBeCloseTo(3.5, 1);
    expect(summary.hoursPerWeek.length).toBeGreaterThan(0);
  });

  it('computes per-subject adherence (capped at 1)', () => {
    const calc = summary.perSubject.find((s) => s.subject === 'Calculus');
    const bio = summary.perSubject.find((s) => s.subject === 'Biology');
    expect(calc.plannedHours).toBe(4);
    expect(calc.loggedHours).toBe(1.5);
    expect(calc.adherence).toBeCloseTo(0.38, 2);
    expect(bio.adherence).toBe(1); // 2h logged vs 1h planned, capped
  });

  it('flags upcoming deadlines at risk', () => {
    const calc = summary.upcomingDeadlines.find((d) => d.subject === 'Calculus');
    const bio = summary.upcomingDeadlines.find((d) => d.subject === 'Biology');
    expect(calc.daysUntil).toBe(3);
    expect(calc.atRisk).toBe(true); // within 7 days and behind plan
    expect(bio.atRisk).toBe(false);
    // sorted by daysUntil ascending
    expect(summary.upcomingDeadlines[0].subject).toBe('Calculus');
  });

  it('handles an empty dataset', () => {
    const empty = buildSummary({ subjects: [], sessions: [], plan: null, now });
    expect(empty.totalHours).toBe(0);
    expect(empty.totalSessions).toBe(0);
    expect(empty.hoursPerWeek).toEqual([]);
    expect(empty.perSubject).toEqual([]);
    expect(empty.upcomingDeadlines).toEqual([]);
  });
});
