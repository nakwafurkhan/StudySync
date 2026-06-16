import { useEffect, useState } from 'react';
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
      <form
        onSubmit={handleGenerate}
        className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="dailyHours">
            Daily study hours
          </label>
          <input
            id="dailyHours"
            type="number"
            min="0.5"
            step="0.5"
            value={dailyHours}
            onChange={(e) => setDailyHours(e.target.value)}
            className="w-32 rounded-md border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={generating}
          className="rounded-md bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {generating ? 'Generating…' : 'Generate schedule'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : !plan ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400">
          No schedule yet. Set your daily hours and generate one.
        </p>
      ) : (
        <div>
          <p className="mb-4 text-sm text-slate-500">
            Plan from {new Date(plan.createdAt).toLocaleDateString()} · {plan.dailyHours}h/day ·
            source: <span className="font-medium">{plan.source}</span>
          </p>
          <div className="space-y-3">
            {plan.generatedSchedule.days.map((day) => (
              <div
                key={day.date}
                className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
              >
                <h3 className="mb-2 font-semibold text-slate-800">{day.date}</h3>
                <ul className="flex flex-wrap gap-2">
                  {day.blocks.map((b, i) => (
                    <li
                      key={`${day.date}-${i}`}
                      className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700"
                    >
                      {b.subject} — {b.hours}h
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
