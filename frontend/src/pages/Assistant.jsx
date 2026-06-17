import Navbar from '../components/Navbar';
import AssistantChat from '../components/AssistantChat';

export default function Assistant() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-cloud">Study assistant</h1>
        <p className="mb-8 mt-2 text-cloud-muted">
          A chat that knows your subjects, deadlines, plan, and sessions — ask it what to do next.
        </p>
        <AssistantChat />
      </main>
    </div>
  );
}
