import Navbar from '../components/Navbar';
import SyllabusImport from '../components/SyllabusImport';

export default function Import() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Import a syllabus</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          Drop in a PDF, paste the text, or give a public URL — the AI pulls out exams, deadlines, and
          weights, and you choose what lands on your calendar.
        </p>
        <SyllabusImport />
      </main>
    </div>
  );
}
