import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../services/assistant';

const SUGGESTIONS = [
  'What should I study first today?',
  'Am I on track for my deadlines?',
  'Plan my week around my exams.',
];

export default function AssistantChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages, loading]);

  const ask = async (text) => {
    const content = (text || '').trim();
    if (!content || loading) return;
    setError('');
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendMessage(next);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.response?.data?.message || 'The assistant is unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    ask(input);
  };

  return (
    <section className="rc-card flex h-[60vh] flex-col p-4">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <div className="text-cloud-muted">
            <p className="mb-3">Ask me about your subjects, deadlines, or what to study next.</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="rounded-pill bg-ink px-3 py-1.5 text-sm text-cloud-muted ring-1 ring-white/[0.06] hover:text-cloud"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-amber text-[#1a1306]'
                  : 'bg-ink text-cloud ring-1 ring-white/[0.06]'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-cloud-dim">Thinking…</div>}
        <div ref={endRef} />
      </div>

      {error && (
        <p role="alert" className="mt-2 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your study assistant…"
          className="rc-input flex-1"
        />
        <button type="submit" disabled={loading || !input.trim()} className="rc-btn-amber">
          Send
        </button>
      </form>
    </section>
  );
}
