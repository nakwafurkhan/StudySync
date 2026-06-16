import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { listSubjects } from '../services/subjects';
import { listSessions, createSession } from '../services/sessions';

const today = () => new Date().toISOString().slice(0, 10);

export default function SessionLogger() {
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ subjectId: '', date: today(), durationMinutes: 30, notes: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([listSubjects(), listSessions()])
      .then(([subs, sess]) => {
        if (!active) return;
        setSubjects(subs);
        setSessions(sess);
        if (subs.length) setForm((f) => ({ ...f, subjectId: f.subjectId || subs[0]._id }));
      })
      .catch(() => {
        if (active) setError('Failed to load your study data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subjectId || !form.durationMinutes) return;
    setError('');
    setSaving(true);
    try {
      const created = await createSession({
        subjectId: form.subjectId,
        date: form.date,
        durationMinutes: Number(form.durationMinutes),
        notes: form.notes,
      });
      setSessions((s) => [created, ...s]);
      setForm((f) => ({ ...f, durationMinutes: 30, notes: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to log session');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-cloud-muted">Loading…</p>;

  if (subjects.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-white/10 bg-ink-soft/50 p-8 text-center text-cloud-dim">
        Add a subject first on the{' '}
        <Link to="/subjects" className="font-semibold text-amber hover:underline">Subjects</Link>{' '}
        page, then come back to log sessions.
      </p>
    );
  }

  return (
    <section>
      <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 gap-3 rounded-card bg-ink-soft p-5 ring-1 ring-white/[0.06] sm:grid-cols-2">
        <div>
          <label className="rc-label" htmlFor="session-subject">Subject</label>
          <select id="session-subject" value={form.subjectId} onChange={update('subjectId')} className="rc-input">
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="rc-label" htmlFor="session-date">Date</label>
          <input id="session-date" type="date" value={form.date} onChange={update('date')} className="rc-input" />
        </div>
        <div>
          <label className="rc-label" htmlFor="session-duration">Duration (minutes)</label>
          <input id="session-duration" type="number" min="1" value={form.durationMinutes} onChange={update('durationMinutes')} className="rc-input" />
        </div>
        <div>
          <label className="rc-label" htmlFor="session-notes">Notes (optional)</label>
          <input id="session-notes" type="text" value={form.notes} onChange={update('notes')} className="rc-input" />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="rc-btn-amber">
            {saving ? 'Logging…' : 'Log session'}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      <h2 className="mb-3 font-display text-lg font-bold text-cloud">Recent sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-cloud-dim">No sessions logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s, i) => (
            <motion.li
              key={s._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="flex items-center justify-between rounded-2xl bg-ink-soft px-4 py-3 ring-1 ring-white/[0.06]"
            >
              <div>
                <span className="font-medium text-cloud">{s.subjectId?.name || 'Unknown'}</span>
                {s.notes && <span className="ml-2 text-sm text-cloud-muted">— {s.notes}</span>}
              </div>
              <div className="flex items-center gap-4 font-mono text-xs text-cloud-dim">
                <span>{s.durationMinutes} min</span>
                <span>{new Date(s.date).toLocaleDateString()}</span>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
