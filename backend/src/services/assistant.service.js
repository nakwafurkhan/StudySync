const { createChatCompletion } = require('./groqClient');

const SYSTEM = [
  "You are StudySync's study assistant.",
  'Help the student plan, prioritize, and stay on track with their courses.',
  'Be concise, practical, and encouraging.',
  'Use ONLY the context provided about their data; if something is not in the context, say you do not have that info.',
  'Reply in plain text (no markdown headings).',
].join(' ');

const iso = (d) => new Date(d).toISOString().slice(0, 10);

/** Compact, grounded context string from the student's data. */
function buildContext({ summary, subjects = [], sessions = [], calendar = [] }) {
  const lines = [];
  lines.push(
    `Totals — hours studied: ${summary.totalHours}, sessions: ${summary.totalSessions}, ` +
      `streak: ${summary.currentStreak} day(s), today: ${summary.todayMinutes}/${summary.dailyGoalMinutes} min.`
  );
  if (subjects.length) {
    lines.push(
      'Subjects: ' +
        subjects.map((s) => `${s.name} (priority ${s.priority}, due ${iso(s.deadline)})`).join('; ') +
        '.'
    );
  }
  if (summary.perSubject?.length) {
    lines.push(
      'Adherence: ' +
        summary.perSubject.map((p) => `${p.subject} ${p.loggedHours}/${p.plannedHours}h`).join('; ') +
        '.'
    );
  }
  if (summary.upcomingDeadlines?.length) {
    lines.push(
      'Upcoming deadlines: ' +
        summary.upcomingDeadlines
          .slice(0, 8)
          .map((d) => `${d.subject} in ${d.daysUntil}d${d.atRisk ? ' (at risk)' : ''}`)
          .join('; ') +
        '.'
    );
  }
  if (calendar.length) {
    lines.push(
      'Calendar: ' +
        calendar.slice(0, 8).map((e) => `${e.title} (${e.type}) ${iso(e.date)}`).join('; ') +
        '.'
    );
  }
  if (sessions.length) {
    lines.push(
      'Recent sessions: ' +
        sessions
          .slice(0, 8)
          .map((s) => `${iso(s.date)} ${s.subjectId?.name || ''} ${s.durationMinutes}m`)
          .join('; ') +
        '.'
    );
  }
  return lines.join('\n');
}

/** Run a grounded chat turn. `history` is [{role:'user'|'assistant', content}]. */
async function chat(history, contextStr) {
  const messages = [
    { role: 'system', content: `${SYSTEM}\n\nStudent's data:\n${contextStr}` },
    ...history,
  ];
  const reply = await createChatCompletion(messages, { json: false, temperature: 0.5 });
  return reply.trim();
}

module.exports = { buildContext, chat, SYSTEM };
