import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Welcome, {user?.name}. Your study schedule and progress will live here.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { to: '/subjects', title: 'Subjects', desc: 'Add subjects & deadlines' },
            { to: '/schedule', title: 'Schedule', desc: 'Generate your AI study plan' },
            { to: '/sessions', title: 'Sessions', desc: 'Log what you studied' },
          ].map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-200"
            >
              <h2 className="font-semibold text-slate-800">{c.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
            </Link>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Progress analytics and charts arrive in the next phase.
        </div>
      </main>
    </div>
  );
}
