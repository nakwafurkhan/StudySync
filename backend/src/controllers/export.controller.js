const PDFDocument = require('pdfkit');
const Subject = require('../models/Subject');
const StudySession = require('../models/StudySession');
const StudyPlan = require('../models/StudyPlan');
const CalendarEvent = require('../models/CalendarEvent');
const { buildSummary } = require('../services/analytics.service');
const { toCsv } = require('../utils/csv');

const isoDate = (d) => new Date(d).toISOString().slice(0, 10);

function sendCsv(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csv);
}

/** GET /api/export/sessions.csv */
async function exportSessionsCsv(req, res, next) {
  try {
    const sessions = await StudySession.find({ userId: req.user.id })
      .populate('subjectId', 'name')
      .sort({ date: -1 });
    const csv = toCsv(sessions, [
      { label: 'Date', value: (s) => isoDate(s.date) },
      { label: 'Subject', value: (s) => s.subjectId?.name || '' },
      { label: 'Minutes', key: 'durationMinutes' },
      { label: 'Completed', value: (s) => (s.completed ? 'yes' : 'no') },
      { label: 'Notes', value: (s) => s.notes || '' },
    ]);
    return sendCsv(res, 'studysync-sessions.csv', csv);
  } catch (err) {
    return next(err);
  }
}

/** GET /api/export/calendar.csv */
async function exportCalendarCsv(req, res, next) {
  try {
    const events = await CalendarEvent.find({ userId: req.user.id }).sort({ date: 1 });
    const csv = toCsv(events, [
      { label: 'Date', value: (e) => isoDate(e.date) },
      { label: 'Title', key: 'title' },
      { label: 'Type', key: 'type' },
      { label: 'Weight %', value: (e) => (e.weightPercent != null ? e.weightPercent : '') },
    ]);
    return sendCsv(res, 'studysync-calendar.csv', csv);
  } catch (err) {
    return next(err);
  }
}

/** GET /api/export/report.pdf — a one-page study report. */
async function exportReportPdf(req, res, next) {
  try {
    // Gather everything BEFORE streaming, so any error still returns JSON.
    const [subjects, sessions, plan] = await Promise.all([
      Subject.find({ userId: req.user.id }),
      StudySession.find({ userId: req.user.id }).populate('subjectId', 'name').sort({ date: -1 }),
      StudyPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 }),
    ]);
    const summary = buildSummary({ subjects, sessions, plan, now: new Date() });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="studysync-report.pdf"');
    doc.pipe(res);

    doc.fontSize(24).fillColor('#14142B').text('StudySync — Study Report');
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text(`${req.user.name}  ·  ${new Date().toLocaleDateString()}`);
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#14142B').text('Overview');
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Total hours studied: ${summary.totalHours}`);
    doc.text(`Sessions logged: ${summary.totalSessions}`);
    doc.text(`Current streak: ${summary.currentStreak} day(s)`);
    doc.text(`Focus today: ${summary.todayMinutes} / ${summary.dailyGoalMinutes} min`);
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#14142B').text('Plan adherence');
    doc.moveDown(0.3).fontSize(11).fillColor('#333333');
    if (summary.perSubject.length === 0) {
      doc.text('No data yet.');
    } else {
      summary.perSubject.forEach((s) => {
        const pct = s.adherence != null ? `${Math.round(s.adherence * 100)}%` : '—';
        doc.text(`• ${s.subject}: ${s.loggedHours}h / ${s.plannedHours}h  (${pct})`);
      });
    }
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#14142B').text('Upcoming deadlines');
    doc.moveDown(0.3).fontSize(11).fillColor('#333333');
    if (summary.upcomingDeadlines.length === 0) {
      doc.text('No subjects yet.');
    } else {
      summary.upcomingDeadlines.forEach((d) => {
        const when = d.daysUntil < 0 ? 'passed' : `in ${d.daysUntil} day(s)`;
        doc.text(`• ${d.subject} — ${d.deadline} (${when})${d.atRisk ? '  ⚠ at risk' : ''}`);
      });
    }
    doc.moveDown(1);

    doc.fontSize(15).fillColor('#14142B').text('Recent sessions');
    doc.moveDown(0.3).fontSize(11).fillColor('#333333');
    if (sessions.length === 0) {
      doc.text('No sessions logged yet.');
    } else {
      sessions.slice(0, 12).forEach((s) => {
        doc.text(`• ${isoDate(s.date)} — ${s.subjectId?.name || 'Unknown'} · ${s.durationMinutes} min`);
      });
    }

    doc.end();
  } catch (err) {
    return next(err);
  }
}

module.exports = { exportSessionsCsv, exportCalendarCsv, exportReportPdf };
