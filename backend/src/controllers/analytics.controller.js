const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const {
  plannedHoursMap,
  perSubjectRows,
  upcomingDeadlineRows,
  streakFromDays,
  round2,
} = require('../services/analytics.service');
const {
  hoursPerWeek,
  loggedHoursBySubject,
  sessionTotals,
} = require('../services/analytics.aggregations');

/**
 * GET /api/analytics/summary
 * Computes hours-per-week, per-subject logged hours, and totals via MongoDB
 * aggregation pipelines (rather than loading every session into Node), then
 * assembles the same summary shape as the pure builder.
 */
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [subjects, plan, weekly, loggedRows, totals] = await Promise.all([
      Subject.find({ userId }),
      StudyPlan.findOne({ userId }).sort({ createdAt: -1 }),
      hoursPerWeek(userId),
      loggedHoursBySubject(userId),
      sessionTotals(userId, now),
    ]);

    const loggedMap = new Map(loggedRows.map((r) => [r.subject, r.hours]));
    const plannedMap = plannedHoursMap(plan);

    const summary = {
      totalHours: round2(totals.totalMinutes / 60),
      totalSessions: totals.totalSessions,
      todayMinutes: totals.todayMinutes,
      dailyGoalMinutes: 240,
      currentStreak: streakFromDays(totals.days, now),
      hoursPerWeek: weekly,
      perSubject: perSubjectRows(subjects, plannedMap, loggedMap),
      upcomingDeadlines: upcomingDeadlineRows(subjects, plannedMap, loggedMap, now),
    };

    return res.json({ summary });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary };
