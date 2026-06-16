import Navbar from '../components/Navbar';
import SessionLogger from '../components/SessionLogger';

export default function Sessions() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Study sessions</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          Log what you actually studied — it feeds your streak, focus ring, and plan adherence.
        </p>
        <SessionLogger />
      </main>
    </div>
  );
}
