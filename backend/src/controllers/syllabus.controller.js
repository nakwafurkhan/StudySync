const { PDFParse } = require('pdf-parse');
const CalendarEvent = require('../models/CalendarEvent');
const { extractSyllabus } = require('../services/syllabus.service');

const EVENT_TYPES = ['exam', 'assignment', 'deadline'];

/** Strip HTML to rough text for URL imports. */
function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Resolve syllabus text from an uploaded PDF, pasted text, or a public URL. */
async function getSyllabusText(req) {
  if (req.file && req.file.buffer) {
    const parser = new PDFParse({ data: req.file.buffer });
    try {
      const result = await parser.getText();
      return result.text || '';
    } finally {
      if (typeof parser.destroy === 'function') await parser.destroy();
    }
  }

  if (req.body?.text && String(req.body.text).trim()) {
    return String(req.body.text);
  }

  if (req.body?.url) {
    const url = String(req.body.url).trim();
    if (!/^https?:\/\//i.test(url)) {
      const err = new Error('Only http(s) URLs are allowed');
      err.status = 400;
      throw err;
    }
    const resp = await fetch(url, { redirect: 'follow' });
    if (!resp.ok) {
      const err = new Error('Could not fetch that URL');
      err.status = 400;
      throw err;
    }
    return htmlToText(await resp.text());
  }

  return '';
}

/**
 * POST /api/syllabus/parse — extract (preview only, nothing saved).
 * Accepts multipart `file` (PDF), or JSON { text } or { url }.
 */
async function parse(req, res, next) {
  try {
    let text;
    try {
      text = await getSyllabusText(req);
    } catch (e) {
      return res.status(e.status || 400).json({ message: e.message });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Provide a PDF, pasted text, or a public URL to parse' });
    }

    let result;
    try {
      result = await extractSyllabus(text);
    } catch {
      return res
        .status(502)
        .json({ message: 'Could not extract a syllabus. Try pasting the text directly.' });
    }
    return res.json(result); // { course, items }
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/syllabus/import — bulk-create calendar events from reviewed items.
 */
async function importItems(req, res, next) {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const course = (req.body?.course || '').trim();

    const toCreate = items
      .filter((it) => it && it.title && it.dueDate && !Number.isNaN(new Date(it.dueDate).getTime()))
      .map((it) => ({
        userId: req.user.id,
        title: course ? `${course}: ${it.title}` : it.title,
        type: EVENT_TYPES.includes(it.type) ? it.type : 'deadline',
        date: new Date(it.dueDate),
        weightPercent:
          it.weightPercent != null && Number.isFinite(Number(it.weightPercent))
            ? Number(it.weightPercent)
            : undefined,
      }));

    if (!toCreate.length) {
      return res.status(400).json({ message: 'No items with valid dates to import' });
    }

    const created = await CalendarEvent.insertMany(toCreate);
    return res.status(201).json({ created: created.length, events: created });
  } catch (err) {
    return next(err);
  }
}

module.exports = { parse, importItems };
