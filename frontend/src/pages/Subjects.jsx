import Navbar from '../components/Navbar';
import SubjectManager from '../components/SubjectManager';

export default function Subjects() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-800">Subjects</h1>
        <p className="mb-8 mt-2 text-slate-600">
          Add the subjects you&apos;re studying and their deadlines. These feed your AI study
          schedule.
        </p>
        <SubjectManager />
      </main>
    </div>
  );
}
