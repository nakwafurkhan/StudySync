import Navbar from '../components/Navbar';
import ScheduleView from '../components/ScheduleView';

export default function Schedule() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Your study schedule</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          Let the AI deal you a day-by-day plan from your subjects and daily study budget.
        </p>
        <ScheduleView />
      </main>
    </div>
  );
}
