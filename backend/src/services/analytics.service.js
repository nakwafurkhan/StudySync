const round2 = (n) => Math.round(n * 100) / 100;
const iso = (d) => new Date(d).toISOString().slice(0, 10);

/** Monday (UTC) of the week containing `date`. */
function startOfWeek(date) {
  const d = new Date(date);
  const dayFromMonday = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayFromMonday);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Pure analytics builder — kept free of DB access so it can be unit-tested.
 * @param {object} args
 * @param {Array} args.subjects  user's subjects ({ name, deadline })
 * @param {Array} args.sessions  sessions ({ subjectId: { name }, durationMinutes, date })
 * @param {object|null} args.plan current StudyPlan ({ generatedSchedule: { days } })
 * @param {Date} args.now
 */
function buildSummary({ subjects = [], sessions = [], plan = null, now = new Date() }) {
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  // Hours studied per week (ascending by week start).
  const weekMinutes = new Map();
  for (const s of sessions) {
    const key = iso(startOfWeek(s.date));
    weekMinutes.set(key, (weekMinutes.get(key) || 0) + (s.durationMinutes || 0));
  }
  const hoursPerWeek = [...weekMinutes.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, mins]) => ({ week, hours: round2(mins / 60) }));

  // Logged minutes per subject name.
  const loggedMin = new Map();
  for (const s of sessions) {
    const name = s.subjectId?.name || 'Unknown';
    loggedMin.set(name, (loggedMin.get(name) || 0) + (s.durationMinutes || 0));
  }

  // Planned hours per subject from the current plan.
  const plannedHrs = new Map();
  for (const day of plan?.generatedSchedule?.days || []) {
    for (const b of day.blocks || []) {
      plannedHrs.set(b.subject, (plannedHrs.get(b.subject) || 0) + (Number(b.hours) || 0));
    }
  }

  const names = new Set([
    ...subjects.map((s) => s.name),
    ...plannedHrs.keys(),
    ...loggedMin.keys(),
  ]);
  const perSubject = [...names].map((name) => {
    const plannedHours = round2(plannedHrs.get(name) || 0);
    const loggedHours = round2((loggedMin.get(name) || 0) / 60);
    const adherence = plannedHours > 0 ? round2(Math.min(loggedHours / plannedHours, 1)) : null;
    return { subject: name, plannedHours, loggedHours, adherence };
  });

  const upcomingDeadlines = subjects
    .map((s) => {
      const daysUntil = Math.ceil((new Date(s.deadline) - now) / 86400000);
      const plannedHours = round2(plannedHrs.get(s.name) || 0);
      const loggedHours = round2((loggedMin.get(s.name) || 0) / 60);
      const atRisk = daysUntil >= 0 && daysUntil <= 7 && (plannedHours === 0 || loggedHours < plannedHours);
      return { subject: s.name, deadline: iso(s.deadline), daysUntil, plannedHours, loggedHours, atRisk };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    totalHours: round2(totalMinutes / 60),
    totalSessions: sessions.length,
    hoursPerWeek,
    perSubject,
    upcomingDeadlines,
  };
}

module.exports = { buildSummary, startOfWeek };
