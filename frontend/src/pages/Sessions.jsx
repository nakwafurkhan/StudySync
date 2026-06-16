import Navbar from '../components/Navbar';
import SessionLogger from '../components/SessionLogger';

export default function Sessions() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800">Study sessions</h1>
        <p className="mb-8 mt-2 text-slate-600">
          Log what you actually studied to track progress against your plan.
        </p>
        <SessionLogger />
      </main>
    </div>
  );
}
