const { createChatCompletion } = require('./groqClient');

const round2 = (n) => Math.round(n * 100) / 100;
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};
const iso = (date) => new Date(date).toISOString().slice(0, 10);

/**
 * Build the chat messages that ask the model for a strict JSON schedule.
 */
function buildPrompt({ subjects, dailyHours, startDate }) {
  const start = new Date(startDate || Date.now());
  const subjectLines = subjects
    .map(
      (s) =>
        `- ${s.name} (priority: ${s.priority || 'medium'}, deadline: ${iso(s.deadline)})`
    )
    .join('\n');

  const system = [
    'You are StudySync, an assistant that builds realistic day-by-day study schedules.',
    'Respond with ONLY a JSON object (no prose, no markdown) matching exactly:',
    '{"days":[{"date":"YYYY-MM-DD","blocks":[{"subject":"<one of the given subjects>","hours":<number>}]}]}.',
    'Rules: use only the provided subject names; the sum of hours within a day must not exceed the daily study budget;',
    'give more time to subjects with earlier deadlines and higher priority; cover dates from the start date through the latest deadline.',
  ].join(' ');

  const user = [
    `Start date: ${iso(start)}`,
    `Daily study budget (hours): ${dailyHours}`,
    'Subjects:',
    subjectLines,
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/**
 * Parse, validate and sanitize a raw model response into a clean schedule.
 * Drops hallucinated subjects and invalid hours, and clamps each day's total
 * to the daily budget. Throws if nothing usable remains.
 */
function parseAndValidateSchedule(raw, { subjectNames = [], dailyHours } = {}) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('Schedule response was not valid JSON');
  }

  const daysRaw = Array.isArray(data?.days)
    ? data.days
    : Array.isArray(data?.schedule?.days)
      ? data.schedule.days
      : null;

  if (!Array.isArray(daysRaw) || daysRaw.length === 0) {
    throw new Error('Schedule JSON missing a non-empty "days" array');
  }

  const known = new Set(subjectNames.map((n) => n.toLowerCase()));
  const days = [];

  for (const day of daysRaw) {
    if (!day || typeof day.date !== 'string') continue;
    const blocksRaw = Array.isArray(day.blocks) ? day.blocks : [];
    const blocks = [];

    for (const b of blocksRaw) {
      if (!b || typeof b.subject !== 'string') continue;
      if (known.size && !known.has(b.subject.toLowerCase())) continue; // drop hallucinations
      const hours = Number(b.hours);
      if (!Number.isFinite(hours) || hours <= 0) continue;
      blocks.push({ subject: b.subject, hours: round2(hours) });
    }

    if (!blocks.length) continue;

    if (dailyHours && Number.isFinite(dailyHours)) {
      const total = blocks.reduce((sum, b) => sum + b.hours, 0);
      if (total > dailyHours) {
        const scale = dailyHours / total;
        blocks.forEach((b) => {
          b.hours = round2(b.hours * scale);
        });
      }
    }

    days.push({ date: day.date, blocks });
  }

  if (!days.length) {
    throw new Error('Schedule had no valid day blocks after validation');
  }
  return { days };
}

/**
 * Deterministic schedule used when the model fails — evenly distributes the
 * daily budget across subjects still before their deadline.
 */
function buildFallbackSchedule({ subjects, dailyHours, startDate }) {
  const start = new Date(startDate || Date.now());
  const deadlines = subjects
    .map((s) => new Date(s.deadline))
    .filter((d) => !Number.isNaN(d.getTime()));
  const maxDeadline = deadlines.length
    ? new Date(Math.max(...deadlines.map((d) => d.getTime())))
    : addDays(start, 7);

  let horizon = Math.ceil((maxDeadline - start) / 86400000) + 1;
  horizon = Math.min(Math.max(horizon, 1), 14);

  const days = [];
  for (let i = 0; i < horizon; i++) {
    const date = addDays(start, i);
    const active = subjects.filter((s) => {
      const d = new Date(s.deadline);
      return Number.isNaN(d.getTime()) || d >= date;
    });
    const pool = active.length ? active : subjects;
    const per = round2(dailyHours / pool.length);
    days.push({
      date: iso(date),
      blocks: pool.map((s) => ({ subject: s.name, hours: per })),
    });
  }
  return { days };
}

/**
 * Generate a schedule: ask OpenAI, validate; retry once; then fall back to a
 * deterministic plan so the endpoint never hard-fails on a bad model response.
 */
async function generateSchedule({ subjects, dailyHours, startDate, maxAttempts = 2 }) {
  const messages = buildPrompt({ subjects, dailyHours, startDate });
  const subjectNames = subjects.map((s) => s.name);
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await createChatCompletion(messages);
      const schedule = parseAndValidateSchedule(raw, { subjectNames, dailyHours });
      return { schedule, source: 'groq', attempts: attempt };
    } catch (err) {
      lastError = err;
    }
  }

  return {
    schedule: buildFallbackSchedule({ subjects, dailyHours, startDate }),
    source: 'fallback',
    attempts: maxAttempts,
    error: lastError ? lastError.message : undefined,
  };
}

module.exports = {
  buildPrompt,
  parseAndValidateSchedule,
  buildFallbackSchedule,
  generateSchedule,
};
