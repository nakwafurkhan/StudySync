import { useState } from 'react';
import { Link } from 'react-router-dom';
import { parseText, parseUrl, parseFile, importItems } from '../services/syllabus';

const MODES = [
  { id: 'pdf', label: 'Upload PDF' },
  { id: 'text', label: 'Paste text' },
  { id: 'url', label: 'Public URL' },
];

const TYPE_COLOR = { exam: '#FF6B6B', assignment: '#FFC857', deadline: '#6FCF97' };

export default function SyllabusImport() {
  const [mode, setMode] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);

  const [result, setResult] = useState(null); // { course, items }
  const [selected, setSelected] = useState(() => new Set());
  const [extracting, setExtracting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null); // { created }

  const handleExtract = async (e) => {
    e.preventDefault();
    setError('');
    setDone(null);
    setExtracting(true);
    try {
      let data;
      if (mode === 'pdf') {
        if (!file) throw new Error('Choose a PDF file first');
        data = await parseFile(file);
      } else if (mode === 'url') {
        data = await parseUrl(url);
      } else {
        data = await parseText(text);
      }
      setResult(data);
      setSelected(new Set(data.items.map((_, i) => i)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not extract the syllabus');
    } finally {
      setExtracting(false);
    }
  };

  const toggle = (i) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleImport = async () => {
    if (!result) return;
    const items = result.items.filter((_, i) => selected.has(i));
    setError('');
    setImporting(true);
    try {
      const res = await importItems(items, result.course);
      setDone({ created: res.created });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add events');
    } finally {
      setImporting(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`rounded-pill px-4 py-1.5 text-sm font-medium transition ${
              mode === m.id ? 'bg-amber/15 text-amber' : 'bg-ink-soft text-cloud-muted hover:text-cloud'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleExtract} className="rc-card p-5">
        {mode === 'text' && (
          <div>
            <label className="rc-label" htmlFor="syllabus-text">Syllabus text</label>
            <textarea
              id="syllabus-text"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rc-input"
              placeholder="Paste your syllabus, assignment list, or schedule here…"
            />
          </div>
        )}
        {mode === 'url' && (
          <div>
            <label className="rc-label" htmlFor="syllabus-url">Public syllabus URL</label>
            <input
              id="syllabus-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rc-input"
              placeholder="https://…"
            />
            <p className="mt-2 text-xs text-cloud-dim">
              Login-gated LMS pages (Canvas, Blackboard) can&apos;t be fetched — export the PDF or paste the text instead.
            </p>
          </div>
        )}
        {mode === 'pdf' && (
          <div>
            <label className="rc-label" htmlFor="syllabus-file">Syllabus PDF</label>
            <input
              id="syllabus-file"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-cloud-muted file:mr-3 file:rounded-pill file:border-0 file:bg-amber file:px-4 file:py-2 file:font-semibold file:text-[#1a1306]"
            />
          </div>
        )}
        <button type="submit" disabled={extracting} className="rc-btn-sky mt-4">
          {extracting ? 'Extracting…' : '✦ Extract'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      {done && (
        <p className="mt-4 rounded-xl bg-mint/15 px-3 py-2 text-sm text-mint">
          Added {done.created} event{done.created === 1 ? '' : 's'} to your{' '}
          <Link to="/calendar" className="font-semibold underline">calendar</Link>.
        </p>
      )}

      {result && (
        <div className="mt-6 rc-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display font-bold text-cloud">
              {result.course ? `${result.course} — ` : ''}{result.items.length} items found
            </h3>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="rc-btn-amber"
            >
              {importing ? 'Adding…' : `Add ${selected.size} to calendar`}
            </button>
          </div>
          <ul className="space-y-2">
            {result.items.map((it, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg bg-ink px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Select ${it.title}`}
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="h-4 w-4 accent-amber"
                />
                <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[it.type] || '#6FCF97' }} />
                <span className="flex-1 text-cloud">{it.title}</span>
                <span className="capitalize text-cloud-dim">{it.type}</span>
                <span className="font-mono text-xs text-cloud-dim">{it.dueDate || 'no date'}</span>
                {it.weightPercent != null && (
                  <span className="font-mono text-xs text-amber">{it.weightPercent}%</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-cloud-dim">Items without a date are skipped on import.</p>
        </div>
      )}
    </section>
  );
}
