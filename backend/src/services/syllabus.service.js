const { createChatCompletion } = require('./groqClient');

const ITEM_TYPES = ['exam', 'assignment', 'deadline'];

/**
 * Build the chat messages that ask the model to extract a study calendar from
 * raw syllabus text.
 */
function buildSyllabusPrompt(text) {
  const system = [
    'You are StudySync, extracting an academic calendar from a course syllabus.',
    'Respond with ONLY a JSON object of the exact shape:',
    '{"course":"<course name or empty>","items":[{"title":"<assignment/exam/deadline name>","type":"exam|assignment|deadline","dueDate":"YYYY-MM-DD or empty","weightPercent":<number or null>}]}.',
    'Extract every graded item, exam, quiz, project, and deadline you can find.',
    'Use ISO dates (YYYY-MM-DD); if the year is missing, infer the most likely academic year. Use null when a weight is unknown.',
  ].join(' ');
  // Cap the text so we stay within token limits on large syllabi.
  const user = `Syllabus:\n${String(text).slice(0, 12000)}`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/**
 * Parse + sanitize the model's JSON into { course, items }. Drops items without
 * a title, coerces unknown types to "deadline", nulls invalid dates/weights.
 */
function parseAndValidateSyllabus(raw) {
  let data;
  try {
    data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    throw new Error('Syllabus response was not valid JSON');
  }

  const course = typeof data?.course === 'string' ? data.course.trim() : '';
  const itemsRaw = Array.isArray(data?.items) ? data.items : null;
  if (!itemsRaw) {
    throw new Error('Syllabus JSON missing an items array');
  }

  const items = [];
  for (const it of itemsRaw) {
    if (!it || typeof it.title !== 'string' || !it.title.trim()) continue;

    const type = ITEM_TYPES.includes(it.type) ? it.type : 'deadline';

    let dueDate = null;
    if (typeof it.dueDate === 'string' && it.dueDate.trim()) {
      const d = new Date(it.dueDate.trim());
      if (!Number.isNaN(d.getTime())) dueDate = it.dueDate.trim().slice(0, 10);
    }

    let weightPercent = null;
    const w = Number(it.weightPercent);
    if (Number.isFinite(w) && w >= 0 && w <= 100) weightPercent = w;

    items.push({ title: it.title.trim(), type, dueDate, weightPercent });
  }

  if (!items.length) {
    throw new Error('No syllabus items could be extracted');
  }
  return { course, items };
}

/**
 * Extract a syllabus: call the model, validate, retry once, then throw.
 */
async function extractSyllabus(text, { maxAttempts = 2 } = {}) {
  if (!text || !String(text).trim()) {
    throw new Error('No syllabus text to parse');
  }
  const messages = buildSyllabusPrompt(text);
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await createChatCompletion(messages, { temperature: 0.2 });
      return parseAndValidateSyllabus(raw);
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Could not parse syllabus: ${lastError ? lastError.message : 'unknown error'}`);
}

/** Map an assignment weight to a subject priority bucket. */
function weightToPriority(weight) {
  if (weight == null) return 'medium';
  if (weight >= 30) return 'high';
  if (weight >= 15) return 'medium';
  return 'low';
}

module.exports = {
  buildSyllabusPrompt,
  parseAndValidateSyllabus,
  extractSyllabus,
  weightToPriority,
};
