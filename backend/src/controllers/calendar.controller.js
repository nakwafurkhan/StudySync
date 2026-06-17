const mongoose = require('mongoose');
const CalendarEvent = require('../models/CalendarEvent');
const StudyPlan = require('../models/StudyPlan');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const EVENT_TYPES = ['exam', 'assignment', 'deadline', 'study'];
const validDate = (v) => v && !Number.isNaN(new Date(v).getTime());

/**
 * POST /api/calendar — create a calendar event.
 */
async function createEvent(req, res, next) {
  try {
    const { title, type, date, weightPercent, subjectId, notes } = req.body || {};
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!validDate(date)) {
      return res.status(400).json({ message: 'A valid date is required' });
    }
    const event = await CalendarEvent.create({
      userId: req.user.id,
      title: title.trim(),
      type: EVENT_TYPES.includes(type) ? type : 'deadline',
      date: new Date(date),
      weightPercent: weightPercent !== undefined ? Number(weightPercent) : undefined,
      subjectId: subjectId && isValidId(subjectId) ? subjectId : undefined,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
    });
    return res.status(201).json({ event });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns the user's saved events in range PLUS read-only "study" events
 * derived from the latest study plan, so the calendar shows study + exams together.
 */
async function listEvents(req, res, next) {
  try {
    const { from, to } = req.query;
    const filter = { userId: req.user.id };
    if (validDate(from) || validDate(to)) {
      filter.date = {};
      if (validDate(from)) filter.date.$gte = new Date(from);
      if (validDate(to)) filter.date.$lte = new Date(`${to}T23:59:59.999Z`);
    }

    const saved = await CalendarEvent.find(filter).sort({ date: 1 });
    const events = saved.map((e) => ({ ...e.toJSON(), derived: false }));

    // Overlay the latest study plan's day blocks as derived study events.
    const plan = await StudyPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    for (const day of plan?.generatedSchedule?.days || []) {
      if (from && day.date < from) continue;
      if (to && day.date > to) continue;
      for (const b of day.blocks || []) {
        events.push({
          _id: `plan-${day.date}-${b.subject}`,
          type: 'study',
          title: `${b.subject} · ${b.hours}h`,
          date: day.date,
          derived: true,
        });
      }
    }

    events.sort((a, b) => (new Date(a.date) < new Date(b.date) ? -1 : 1));
    return res.json({ events });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/calendar/:id — delete an owned (non-derived) event.
 */
async function removeEvent(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const event = await CalendarEvent.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    return res.json({ message: 'Event deleted', id: req.params.id });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createEvent, listEvents, removeEvent };
