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

function StatCard({ label, value, accent }) {
  return (
    <div className="rc-card flex items-center gap-4 p-5">
      {accent}
      <div>
        <p className="text-xs uppercase tracking-wide text-cloud-dim">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-cloud">{value}</p>
      </div>
    </div>
  );
}

function FocusRing({ minutes, goal }) {
  const R = 24;
  const C = 2 * Math.PI * R;
  const pct = Math.min((minutes || 0) / (goal || 240), 1);
  const offset = C - C * pct;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="flex-shrink-0">
      <circle cx="28" cy="28" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx="28"
        cy="28"
        r={R}
        fill="none"
        stroke="#FFC857"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={offset}
        transform="rotate(-90 28 28)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.22,1,.36,1)' }}
      />
    </svg>
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

  if (loading) return <p className="text-cloud-muted">Loading analytics…</p>;
  if (error) return <p role="alert" className="rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">{error}</p>;
  if (!summary) return null;

  const { totalHours, totalSessions, hoursPerWeek, perSubject, upcomingDeadlines } = summary;
  const todayMinutes = summary.todayMinutes || 0;
  const goalMinutes = summary.dailyGoalMinutes || 240;
  const currentStreak = summary.currentStreak || 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Focus today"
          value={`${todayMinutes}m / ${Math.round(goalMinutes / 60)}h`}
          accent={<FocusRing minutes={todayMinutes} goal={goalMinutes} />}
        />
        <StatCard label="Day streak" value={currentStreak} accent={<span className="text-2xl">🔥</span>} />
        <StatCard label="Total hours studied" value={totalHours} accent={<span className="text-2xl">⏱️</span>} />
        <StatCard label="Sessions logged" value={totalSessions} accent={<span className="text-2xl">📇</span>} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-cloud">Hours per week</h2>
        {hoursPerWeek.length === 0 ? (
          <p className="text-cloud-dim">No sessions logged yet.</p>
        ) : (
          <div className="rc-card p-4" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursPerWeek} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="week" fontSize={12} stroke="#74719B" />
                <YAxis fontSize={12} stroke="#74719B" />
                <Tooltip
                  contentStyle={{ background: '#1F1F45', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F3F1FB' }}
                />
                <Bar dataKey="hours" fill="#FFC857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-cloud">Plan adherence</h2>
        {perSubject.length === 0 ? (
          <p className="text-cloud-dim">Generate a schedule to track adherence.</p>
        ) : (
          <ul className="space-y-3">
            {perSubject.map((s) => (
              <li key={s.subject} className="rc-card px-4 py-3">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-cloud">{s.subject}</span>
                  <span className="font-mono text-cloud-muted">{s.loggedHours}h / {s.plannedHours}h</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-pill bg-white/[0.06]">
                  <div
                    className="h-full rounded-pill bg-mint"
                    style={{ width: `${Math.round((s.adherence ?? 0) * 100)}%`, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-cloud">Upcoming deadlines</h2>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-cloud-dim">No subjects yet.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingDeadlines.map((d) => (
              <li key={d.subject} className="flex items-center justify-between rc-card px-4 py-3">
                <span className="font-medium text-cloud">{d.subject}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-cloud-muted">{d.daysUntil < 0 ? 'passed' : `${d.daysUntil} days`}</span>
                  {d.atRisk && (
                    <span className="rounded-pill bg-coral/15 px-2 py-0.5 text-xs font-semibold text-coral">At risk</span>
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
