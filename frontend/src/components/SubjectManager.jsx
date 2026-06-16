import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { listSubjects, createSubject, deleteSubject } from '../services/subjects';
import { priorityOf } from '../theme';

const emptyForm = { name: '', deadline: '', priority: 'medium' };

export default function SubjectManager() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listSubjects()
      .then((data) => {
        if (active) setSubjects(data);
      })
      .catch(() => {
        if (active) setError('Failed to load subjects');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.deadline) return;
    setError('');
    setSaving(true);
    try {
      const created = await createSubject({
        name: form.name,
        deadline: form.deadline,
        priority: form.priority,
      });
      setSubjects((s) => [...s, created]);
      setForm(emptyForm);
    } catch {
      setError('Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubject(id);
      setSubjects((s) => s.filter((x) => x._id !== id));
    } catch {
      setError('Failed to delete subject');
    }
  };

  return (
    <section>
      <form
        onSubmit={handleAdd}
        className="mb-6 grid grid-cols-1 gap-3 rounded-card bg-ink-soft p-5 ring-1 ring-white/[0.06] sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label className="rc-label" htmlFor="subject-name">Subject name</label>
          <input id="subject-name" type="text" required value={form.name} onChange={update('name')} className="rc-input" />
        </div>
        <div>
          <label className="rc-label" htmlFor="subject-deadline">Deadline</label>
          <input id="subject-deadline" type="date" required value={form.deadline} onChange={update('deadline')} className="rc-input" />
        </div>
        <div>
          <label className="rc-label" htmlFor="subject-priority">Priority</label>
          <select id="subject-priority" value={form.priority} onChange={update('priority')} className="rc-input">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button type="submit" disabled={saving} className="rc-btn-amber">
          {saving ? 'Adding…' : 'Add subject'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      {loading ? (
        <p className="text-cloud-muted">Loading…</p>
      ) : subjects.length === 0 ? (
        <p className="rounded-card border border-dashed border-white/10 bg-ink-soft/50 p-8 text-center text-cloud-dim">
          No subjects yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {subjects.map((s, i) => {
            const pr = priorityOf(s.priority);
            return (
              <motion.li
                key={s._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex items-center justify-between rounded-2xl bg-ink-soft px-4 py-3 ring-1 ring-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: pr.hex }} />
                  <span className="font-medium text-cloud">{s.name}</span>
                  <span className={`rounded-pill px-2 py-0.5 text-xs font-semibold capitalize ${pr.chip}`}>
                    {s.priority}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-cloud-dim">
                    {new Date(s.deadline).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => handleDelete(s._id)}
                    className="text-sm font-medium text-coral/80 transition hover:text-coral"
                  >
                    Delete
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
