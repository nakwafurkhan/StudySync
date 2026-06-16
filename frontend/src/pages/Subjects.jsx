import Navbar from '../components/Navbar';
import SubjectManager from '../components/SubjectManager';

export default function Subjects() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Subjects</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          Add what you&apos;re studying and its deadline. Priority colors flow through your whole deck.
        </p>
        <SubjectManager />
      </main>
    </div>
  );
}
