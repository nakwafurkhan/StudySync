import Navbar from '../components/Navbar';
import CalendarBoard from '../components/CalendarBoard';
import { exportCalendarCsv } from '../services/export';

export default function Calendar() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Academic calendar</h1>
            <p className="mb-8 mt-2 text-cloud-muted">
              Exams, assignment deadlines, and your AI study blocks — all in one place.
            </p>
          </div>
          <button type="button" onClick={() => exportCalendarCsv()} className="rc-btn-ghost shrink-0 text-sm">
            ⬇ CSV
          </button>
        </div>
        <CalendarBoard />
      </main>
    </div>
  );
}
