import Navbar from '../components/Navbar';
import ScheduleView from '../components/ScheduleView';

export default function Schedule() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800">Your study schedule</h1>
        <p className="mb-8 mt-2 text-slate-600">
          Generate an AI plan from your subjects and daily study budget.
        </p>
        <ScheduleView />
      </main>
    </div>
  );
}
