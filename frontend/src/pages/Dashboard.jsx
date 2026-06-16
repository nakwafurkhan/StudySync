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
        <Link
          to="/subjects"
          className="mt-6 inline-block rounded-md bg-brand-600 px-4 py-2 font-semibold text-white transition hover:bg-brand-700"
        >
          Manage subjects
        </Link>
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Coming in later phases: an AI-generated schedule, session logging, and analytics charts.
        </div>
      </main>
    </div>
  );
}
