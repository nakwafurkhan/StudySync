import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getCurrentSchedule, generateSchedule } from '../services/schedule';

export default function ScheduleView() {
  const [plan, setPlan] = useState(null);
  const [dailyHours, setDailyHours] = useState(3);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentSchedule()
      .then((p) => {
        if (active) setPlan(p);
      })
      .catch(() => {
        if (active) setError('Failed to load your schedule');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const p = await generateSchedule({ dailyHours: Number(dailyHours) });
      setPlan(p);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate a schedule');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleGenerate} className="mb-6 flex flex-wrap items-end gap-3 rounded-card bg-ink-soft p-5 ring-1 ring-white/[0.06]">
        <div>
          <label className="rc-label" htmlFor="dailyHours">Daily study hours</label>
          <input id="dailyHours" type="number" min="0.5" step="0.5" value={dailyHours} onChange={(e) => setDailyHours(e.target.value)} className="rc-input w-32" />
        </div>
        <button type="submit" disabled={generating} className="rc-btn-sky">
          {generating ? 'Generating…' : '✦ Generate schedule'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>
      )}

      {loading ? (
        <p className="text-cloud-muted">Loading…</p>
      ) : !plan ? (
        <p className="rounded-card border border-dashed border-white/10 bg-ink-soft/50 p-8 text-center text-cloud-dim">
          No schedule yet. Set your daily hours and generate one.
        </p>
      ) : (
        <div>
          <p className="mb-4 font-mono text-xs text-cloud-dim">
            Plan from {new Date(plan.createdAt).toLocaleDateString()} · {plan.dailyHours}h/day · source:{' '}
            <span className="text-amber">{plan.source}</span>
          </p>
          <div className="space-y-3">
            {plan.generatedSchedule.days.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                className="rounded-2xl bg-ink-soft px-4 py-3 ring-1 ring-white/[0.06]"
              >
                <h3 className="mb-2 font-display font-bold text-cloud">{day.date}</h3>
                <ul className="flex flex-wrap gap-2">
                  {day.blocks.map((b, j) => (
                    <li key={`${day.date}-${j}`} className="rounded-pill bg-amber/15 px-3 py-1 text-sm text-amber">
                      {b.subject} — {b.hours}h
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
