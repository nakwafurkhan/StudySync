const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * POST /api/sessions — log a completed study session against an owned subject.
 */
async function createSession(req, res, next) {
  try {
    const { subjectId, date, durationMinutes, notes, completed } = req.body || {};

    if (!subjectId || !isValidId(subjectId)) {
      return res.status(400).json({ message: 'A valid subjectId is required' });
    }
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return res.status(400).json({ message: 'durationMinutes must be a positive number' });
    }

    // The subject must belong to the current user.
    const subject = await Subject.findOne({ _id: subjectId, userId: req.user.id });
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    const session = await StudySession.create({
      userId: req.user.id,
      subjectId,
      date: date ? new Date(date) : new Date(),
      durationMinutes: minutes,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
      completed: completed !== undefined ? Boolean(completed) : true,
    });
    await session.populate('subjectId', 'name');

    return res.status(201).json({ session });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/sessions — list the user's sessions (newest first), optional
 * ?subjectId filter. Subject name is populated for display.
 */
async function listSessions(req, res, next) {
  try {
    const filter = { userId: req.user.id };
    if (req.query.subjectId && isValidId(req.query.subjectId)) {
      filter.subjectId = req.query.subjectId;
    }
    const sessions = await StudySession.find(filter)
      .populate('subjectId', 'name')
      .sort({ date: -1 });
    return res.json({ sessions });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createSession, listSessions };
