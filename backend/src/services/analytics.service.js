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

/** Planned hours per subject from a study plan's day blocks. */
function plannedHoursMap(plan) {
  const map = new Map();
  for (const day of plan?.generatedSchedule?.days || []) {
    for (const b of day.blocks || []) {
      map.set(b.subject, (map.get(b.subject) || 0) + (Number(b.hours) || 0));
    }
  }
  return map;
}

/**
 * Per-subject adherence rows from planned + logged HOURS maps (Map<name, hours>).
 * Shared by the JS builder and the aggregation path so they stay identical.
 */
function perSubjectRows(subjects, plannedMap, loggedMap) {
  const names = new Set([
    ...subjects.map((s) => s.name),
    ...plannedMap.keys(),
    ...loggedMap.keys(),
  ]);
  return [...names].map((name) => {
    const plannedHours = round2(plannedMap.get(name) || 0);
    const loggedHours = round2(loggedMap.get(name) || 0);
    const adherence = plannedHours > 0 ? round2(Math.min(loggedHours / plannedHours, 1)) : null;
    return { subject: name, plannedHours, loggedHours, adherence };
  });
}

/** Upcoming-deadline rows (sorted by daysUntil) from planned + logged HOURS maps. */
function upcomingDeadlineRows(subjects, plannedMap, loggedMap, now) {
  return subjects
    .map((s) => {
      const daysUntil = Math.ceil((new Date(s.deadline) - now) / 86400000);
      const plannedHours = round2(plannedMap.get(s.name) || 0);
      const loggedHours = round2(loggedMap.get(s.name) || 0);
      const atRisk = daysUntil >= 0 && daysUntil <= 7 && (plannedHours === 0 || loggedHours < plannedHours);
      return { subject: s.name, deadline: iso(s.deadline), daysUntil, plannedHours, loggedHours, atRisk };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Current streak (consecutive days with a session, ending today + 1 grace). */
function streakFromDays(dayKeys, now) {
  const daySet = new Set(dayKeys);
  let streak = 0;
  const cursor = new Date(now);
  if (!daySet.has(iso(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (daySet.has(iso(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/**
 * Pure analytics builder from in-memory arrays (no DB). Used by the PDF report
 * and unit-tested directly. The /api/analytics endpoint uses the aggregation
 * path (analytics.aggregations.js) which produces the same shape.
 */
function buildSummary({ subjects = [], sessions = [], plan = null, now = new Date() }) {
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  const weekMinutes = new Map();
  for (const s of sessions) {
    const key = iso(startOfWeek(s.date));
    weekMinutes.set(key, (weekMinutes.get(key) || 0) + (s.durationMinutes || 0));
  }
  const hoursPerWeek = [...weekMinutes.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, mins]) => ({ week, hours: round2(mins / 60) }));

  const loggedMap = new Map();
  for (const s of sessions) {
    const name = s.subjectId?.name || 'Unknown';
    loggedMap.set(name, (loggedMap.get(name) || 0) + (s.durationMinutes || 0) / 60);
  }
  const plannedMap = plannedHoursMap(plan);

  const todayKey = iso(now);
  const todayMinutes = sessions
    .filter((s) => iso(s.date) === todayKey)
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  return {
    totalHours: round2(totalMinutes / 60),
    totalSessions: sessions.length,
    todayMinutes,
    dailyGoalMinutes: 240,
    currentStreak: streakFromDays(sessions.map((s) => iso(s.date)), now),
    hoursPerWeek,
    perSubject: perSubjectRows(subjects, plannedMap, loggedMap),
    upcomingDeadlines: upcomingDeadlineRows(subjects, plannedMap, loggedMap, now),
  };
}

module.exports = {
  buildSummary,
  startOfWeek,
  plannedHoursMap,
  perSubjectRows,
  upcomingDeadlineRows,
  streakFromDays,
  round2,
};
