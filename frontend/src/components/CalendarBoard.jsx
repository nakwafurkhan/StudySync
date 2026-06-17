import { useEffect, useMemo, useState } from 'react';
import { listEvents, createEvent, deleteEvent } from '../services/calendar';

const TYPE_COLOR = {
  exam: '#FF6B6B',
  assignment: '#FFC857',
  study: '#5DD5E8',
  deadline: '#6FCF97',
};
const ADD_TYPES = ['exam', 'assignment', 'deadline'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayKeyOfEvent = (e) => String(e.date).slice(0, 10);

export default function CalendarBoard({ initialDate }) {
  const [view, setView] = useState(() => (initialDate ? new Date(initialDate) : new Date()));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'assignment', weightPercent: '' });

  const year = view.getFullYear();
  const month = view.getMonth();
  const monthLabel = view.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [year, month]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listEvents(keyOf(cells[0]), keyOf(cells[41]));
      setEvents(data);
    } catch {
      setError('Failed to load your calendar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  const byDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      const k = dayKeyOfEvent(e);
      (map[k] = map[k] || []).push(e);
    }
    return map;
  }, [events]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !selectedDay) return;
    try {
      await createEvent({
        title: form.title,
        type: form.type,
        date: selectedDay,
        weightPercent: form.weightPercent ? Number(form.weightPercent) : undefined,
      });
      setForm({ title: '', type: 'assignment', weightPercent: '' });
      await load();
    } catch {
      setError('Failed to add event');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      await load();
    } catch {
      setError('Failed to delete event');
    }
  };

  const selectedEvents = selectedDay ? byDay[selectedDay] || [] : [];

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rc-btn-ghost px-3 py-1.5"
        >
          ‹
        </button>
        <h2 className="font-display text-xl font-bold text-cloud">{monthLabel}</h2>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rc-btn-ghost px-3 py-1.5"
        >
          ›
        </button>
      </div>

      {error && <p role="alert" className="mb-3 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>}

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w) => (
          <div key={w} className="pb-1 text-center text-xs font-semibold uppercase tracking-wide text-cloud-dim">
            {w}
          </div>
        ))}
        {cells.map((d) => {
          const k = keyOf(d);
          const inMonth = d.getMonth() === month;
          const dayEvents = byDay[k] || [];
          const isSelected = selectedDay === k;
          return (
            <button
              key={k}
              type="button"
              aria-label={k}
              onClick={() => setSelectedDay(k)}
              className={`min-h-[78px] rounded-xl border p-1.5 text-left transition ${
                isSelected ? 'border-amber/60 bg-ink-soft2' : 'border-white/[0.06] bg-ink-soft'
              } ${inMonth ? '' : 'opacity-40'}`}
            >
              <span className="font-mono text-xs text-cloud-muted">{d.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <div
                    key={ev._id || i}
                    className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] leading-tight text-cloud"
                    style={{ background: `${TYPE_COLOR[ev.type] || '#6FCF97'}22` }}
                  >
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: TYPE_COLOR[ev.type] || '#6FCF97' }} />
                    <span className="truncate">{ev.title}</span>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] text-cloud-dim">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {loading && <p className="mt-3 text-sm text-cloud-dim">Loading…</p>}

      <div className="mt-6 rc-card p-5">
        <h3 className="font-display font-bold text-cloud">
          {selectedDay ? `Events on ${selectedDay}` : 'Pick a day to add an event'}
        </h3>

        {selectedEvents.length > 0 && (
          <ul className="mt-3 space-y-2">
            {selectedEvents.map((ev) => (
              <li key={ev._id} className="flex items-center justify-between rounded-lg bg-ink px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLOR[ev.type] || '#6FCF97' }} />
                  <span className="text-cloud">{ev.title}</span>
                  <span className="text-cloud-dim capitalize">· {ev.type}</span>
                  {ev.weightPercent ? <span className="text-cloud-dim">· {ev.weightPercent}%</span> : null}
                </span>
                {ev.derived ? (
                  <span className="text-xs text-cloud-dim">from plan</span>
                ) : (
                  <button
                    type="button"
                    aria-label={`Delete ${ev.title}`}
                    onClick={() => handleDelete(ev._id)}
                    className="text-xs font-medium text-coral/80 hover:text-coral"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAdd} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div>
            <label className="rc-label" htmlFor="cal-title">Event title</label>
            <input
              id="cal-title"
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="rc-input"
              placeholder={selectedDay ? '' : 'Select a day first'}
            />
          </div>
          <div>
            <label className="rc-label" htmlFor="cal-type">Event type</label>
            <select
              id="cal-type"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="rc-input"
            >
              {ADD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="rc-label" htmlFor="cal-weight">Weight %</label>
            <input
              id="cal-weight"
              type="number"
              min="0"
              max="100"
              value={form.weightPercent}
              onChange={(e) => setForm((f) => ({ ...f, weightPercent: e.target.value }))}
              className="rc-input w-24"
            />
          </div>
          <button type="submit" disabled={!selectedDay} className="rc-btn-amber">Add event</button>
        </form>
      </div>
    </section>
  );
}
