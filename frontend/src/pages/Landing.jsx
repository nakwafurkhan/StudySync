import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { glyph: '🤖', title: 'AI study schedules', desc: 'Day-by-day plans from your subjects and time budget — validated, with a fallback.' },
  { glyph: '🗓️', title: 'Academic calendar', desc: 'Exams, deadlines, and your study blocks in one color-coded month view.' },
  { glyph: '📥', title: 'Syllabus import', desc: 'Drop in a PDF — the AI pulls out exams, deadlines, and weights.' },
  { glyph: '📊', title: 'Progress analytics', desc: 'Hours per week, plan adherence, a study streak, and a focus-goal ring.' },
  { glyph: '💬', title: 'Study assistant', desc: 'A chat that knows your courses and tells you what to do next.' },
  { glyph: '📄', title: 'Exports', desc: 'Download your sessions and a branded PDF study report.' },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 -rotate-6 items-center justify-center rounded-[9px] bg-gradient-to-br from-amber to-[#ffb02e] text-base shadow-glow">🂡</span>
          <span className="font-display text-lg font-extrabold tracking-tight">StudySync</span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className="rc-btn-amber text-sm">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="rc-btn-ghost text-sm">Log in</Link>
              <Link to="/register" className="rc-btn-amber text-sm">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 text-center sm:py-24">
          <p className="mb-4 inline-block rounded-pill bg-amber/15 px-3 py-1 text-sm font-medium text-amber">
            AI study planner · academic calendar
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-cloud sm:text-6xl">
            Plan smarter. Recall more.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-cloud-muted">
            StudySync turns your subjects, deadlines, and syllabi into an AI study plan, a unified
            calendar, and the analytics to keep you on track.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="rc-btn-amber">Open your dashboard</Link>
            ) : (
              <>
                <Link to="/register" className="rc-btn-amber">Get started — it&apos;s free</Link>
                <Link to="/login" className="rc-btn-ghost">Try the demo</Link>
              </>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rc-card p-6">
              <div className="text-3xl">{f.glyph}</div>
              <h3 className="mt-3 font-display text-lg font-bold text-cloud">{f.title}</h3>
              <p className="mt-1 text-sm text-cloud-muted">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8 text-center text-sm text-cloud-dim">
        Built with the MERN stack · React, Express, MongoDB, Groq AI ·{' '}
        <a href="https://github.com/nakwafurkhan/StudySync" target="_blank" rel="noopener noreferrer" className="text-cloud-muted hover:text-cloud">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
