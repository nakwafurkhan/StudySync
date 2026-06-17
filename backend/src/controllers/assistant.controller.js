const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const StudyPlan = require('../models/StudyPlan');
const CalendarEvent = require('../models/CalendarEvent');
const { buildSummary } = require('../services/analytics.service');
const { buildContext, chat } = require('../services/assistant.service');

const MAX_HISTORY = 12;

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim()
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

/**
 * POST /api/assistant/chat
 * Body: { messages: [{ role, content }] } or { message: string }.
 * Grounds the reply in the student's subjects, sessions, plan, and calendar.
 */
async function chatHandler(req, res, next) {
  try {
    let history = sanitizeHistory(req.body?.messages);
    if (!history.length && typeof req.body?.message === 'string' && req.body.message.trim()) {
      history = [{ role: 'user', content: req.body.message.slice(0, 2000) }];
    }
    if (!history.length || history[history.length - 1].role !== 'user') {
      return res.status(400).json({ message: 'A user message is required' });
    }

    const now = new Date();
    const [subjects, sessions, plan, calendar] = await Promise.all([
      Subject.find({ userId: req.user.id }),
      StudySession.find({ userId: req.user.id }).populate('subjectId', 'name').sort({ date: -1 }).limit(20),
      StudyPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 }),
      CalendarEvent.find({ userId: req.user.id, date: { $gte: now } }).sort({ date: 1 }).limit(12),
    ]);

    const summary = buildSummary({ subjects, sessions, plan, now });
    const context = buildContext({ summary, subjects, sessions, calendar });

    let reply;
    try {
      reply = await chat(history, context);
    } catch {
      return res
        .status(502)
        .json({ message: 'The study assistant is unavailable right now. Please try again.' });
    }

    return res.json({ reply });
  } catch (err) {
    return next(err);
  }
}

module.exports = { chat: chatHandler, sanitizeHistory };
