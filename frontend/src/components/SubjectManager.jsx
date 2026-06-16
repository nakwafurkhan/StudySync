import { useEffect, useState } from 'react';
import { listSubjects, createSubject, deleteSubject } from '../services/subjects';

const PRIORITY_STYLES = {
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

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
        className="mb-6 grid grid-cols-1 gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subject-name">
            Subject name
          </label>
          <input
            id="subject-name"
            type="text"
            required
            value={form.name}
            onChange={update('name')}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subject-deadline">
            Deadline
          </label>
          <input
            id="subject-deadline"
            type="date"
            required
            value={form.deadline}
            onChange={update('deadline')}
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="subject-priority">
            Priority
          </label>
          <select
            id="subject-priority"
            value={form.priority}
            onChange={update('priority')}
            className="rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Adding…' : 'Add subject'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : subjects.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          No subjects yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {subjects.map((s) => (
            <li
              key={s._id}
              className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-800">{s.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.medium
                  }`}
                >
                  {s.priority}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500">
                  {new Date(s.deadline).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${s.name}`}
                  onClick={() => handleDelete(s._id)}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
