import Navbar from '../components/Navbar';
import CalendarBoard from '../components/CalendarBoard';

export default function Calendar() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Academic calendar</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          Exams, assignment deadlines, and your AI study blocks — all in one place.
        </p>
        <CalendarBoard />
      </main>
    </div>
  );
}
