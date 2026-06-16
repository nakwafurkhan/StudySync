import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getSummary } from '../services/analytics';

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

export default function DashboardAnalytics() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSummary()
      .then((s) => {
        if (active) setSummary(s);
      })
      .catch(() => {
        if (active) setError('Failed to load analytics');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <p className="text-slate-500">Loading analytics…</p>;
  if (error)
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
        {error}
      </p>
    );
  if (!summary) return null;

  const { totalHours, totalSessions, hoursPerWeek, perSubject, upcomingDeadlines } = summary;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total hours studied" value={totalHours} />
        <StatCard label="Sessions logged" value={totalSessions} />
        <StatCard label="Subjects tracked" value={perSubject.length} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Hours per week</h2>
        {hoursPerWeek.length === 0 ? (
          <p className="text-slate-400">No sessions logged yet.</p>
        ) : (
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursPerWeek} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="week" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="hours" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Plan adherence</h2>
        {perSubject.length === 0 ? (
          <p className="text-slate-400">Generate a schedule to track adherence.</p>
        ) : (
          <ul className="space-y-3">
            {perSubject.map((s) => (
              <li key={s.subject} className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{s.subject}</span>
                  <span className="text-slate-500">
                    {s.loggedHours}h / {s.plannedHours}h
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${Math.round((s.adherence ?? 0) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Upcoming deadlines</h2>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-slate-400">No subjects yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingDeadlines.map((d) => (
              <li
                key={d.subject}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"
              >
                <span className="font-medium text-slate-800">{d.subject}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">
                    {d.daysUntil < 0 ? 'passed' : `${d.daysUntil} days`}
                  </span>
                  {d.atRisk && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      At risk
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
