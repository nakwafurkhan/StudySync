const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const StudyPlan = require('../models/StudyPlan');
const { buildSummary } = require('../services/analytics.service');

/**
 * GET /api/analytics/summary — progress analytics for the current user:
 * hours studied per week, plan adherence per subject, and deadlines at risk.
 */
async function getSummary(req, res, next) {
  try {
    const [subjects, sessions, plan] = await Promise.all([
      Subject.find({ userId: req.user.id }),
      StudySession.find({ userId: req.user.id }).populate('subjectId', 'name'),
      StudyPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 }),
    ]);

    const summary = buildSummary({ subjects, sessions, plan, now: new Date() });
    return res.json({ summary });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getSummary };
