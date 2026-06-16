const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const { generateSchedule } = require('../services/schedule.service');

/**
 * POST /api/schedule/generate
 * Pulls the user's subjects, asks the AI service for a schedule, and saves it.
 */
async function generate(req, res, next) {
  try {
    const dailyHours = Number(req.body?.dailyHours);
    if (!dailyHours || dailyHours <= 0) {
      return res.status(400).json({ message: 'dailyHours must be a positive number' });
    }

    const subjectDocs = await Subject.find({ userId: req.user.id }).sort({ deadline: 1 });
    if (subjectDocs.length === 0) {
      return res
        .status(400)
        .json({ message: 'Add at least one subject before generating a schedule' });
    }

    const subjects = subjectDocs.map((s) => ({
      name: s.name,
      deadline: s.deadline,
      priority: s.priority,
    }));
    const startDate = req.body?.startDate ? new Date(req.body.startDate) : new Date();

    const { schedule, source } = await generateSchedule({ subjects, dailyHours, startDate });

    const plan = await StudyPlan.create({
      userId: req.user.id,
      subjects,
      dailyHours,
      generatedSchedule: schedule,
      source,
    });

    return res.status(201).json({ plan });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/schedule/current — the user's most recently generated plan.
 */
async function getCurrent(req, res, next) {
  try {
    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (!plan) {
      return res.status(404).json({ message: 'No schedule generated yet' });
    }
    return res.json({ plan });
  } catch (err) {
    return next(err);
  }
}

module.exports = { generate, getCurrent };
