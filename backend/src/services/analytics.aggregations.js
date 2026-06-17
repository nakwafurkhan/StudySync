const mongoose = require('mongoose');
const StudySession = require('../models/StudySession');

const oid = (id) => new mongoose.Types.ObjectId(id);

/**
 * Hours studied per ISO week (Monday-start, UTC), ascending.
 * Uses $dateTrunc to bucket sessions by week entirely in MongoDB.
 */
async function hoursPerWeek(userId) {
  return StudySession.aggregate([
    { $match: { userId: oid(userId) } },
    {
      $group: {
        _id: { $dateTrunc: { date: '$date', unit: 'week', startOfWeek: 'monday', timezone: 'UTC' } },
        minutes: { $sum: '$durationMinutes' },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        week: { $dateToString: { format: '%Y-%m-%d', date: '$_id', timezone: 'UTC' } },
        hours: { $round: [{ $divide: ['$minutes', 60] }, 2] },
      },
    },
  ]);
}

/**
 * Logged hours per subject — groups sessions by subject and $lookups the name.
 * Returns [{ subject, hours }].
 */
async function loggedHoursBySubject(userId) {
  return StudySession.aggregate([
    { $match: { userId: oid(userId) } },
    { $group: { _id: '$subjectId', minutes: { $sum: '$durationMinutes' } } },
    { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 'subject' } },
    { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        subject: { $ifNull: ['$subject.name', 'Unknown'] },
        hours: { $round: [{ $divide: ['$minutes', 60] }, 2] },
      },
    },
  ]);
}

/**
 * Totals in one faceted pipeline: overall minutes/count, today's minutes, and
 * the set of distinct day keys (for the streak).
 */
async function sessionTotals(userId, now = new Date()) {
  const startToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endToday = new Date(startToday.getTime() + 86400000 - 1);

  const [res] = await StudySession.aggregate([
    { $match: { userId: oid(userId) } },
    {
      $facet: {
        all: [{ $group: { _id: null, minutes: { $sum: '$durationMinutes' }, count: { $sum: 1 } } }],
        today: [
          { $match: { date: { $gte: startToday, $lte: endToday } } },
          { $group: { _id: null, minutes: { $sum: '$durationMinutes' } } },
        ],
        days: [
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: 'UTC' } } } },
        ],
      },
    },
  ]);

  return {
    totalMinutes: res?.all?.[0]?.minutes || 0,
    totalSessions: res?.all?.[0]?.count || 0,
    todayMinutes: res?.today?.[0]?.minutes || 0,
    days: (res?.days || []).map((d) => d._id),
  };
}

module.exports = { hoursPerWeek, loggedHoursBySubject, sessionTotals };
