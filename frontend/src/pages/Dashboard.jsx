import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DashboardAnalytics from '../components/DashboardAnalytics';
import { useAuth } from '../context/AuthContext';

const QUICK_LINKS = [
  { to: '/subjects', title: 'Subjects', desc: 'Add subjects & deadlines', glyph: '📚' },
  { to: '/schedule', title: 'Schedule', desc: 'Generate your AI study plan', glyph: '🗓️' },
  { to: '/sessions', title: 'Sessions', desc: 'Log what you studied', glyph: '⏱️' },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Dashboard</h1>
        <p className="mt-2 text-cloud-muted">
          Welcome, {user?.name}. Here&apos;s your deck at a glance.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {QUICK_LINKS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rc-card p-5 transition hover:-translate-y-0.5 hover:ring-amber/40"
            >
              <div className="text-2xl">{c.glyph}</div>
              <h2 className="mt-2 font-display font-bold text-cloud">{c.title}</h2>
              <p className="mt-1 text-sm text-cloud-muted">{c.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <DashboardAnalytics />
        </div>
      </main>
    </div>
  );
}
