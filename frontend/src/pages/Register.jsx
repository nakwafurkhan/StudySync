import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-card bg-ink-soft p-8 shadow-amb ring-1 ring-white/[0.06]">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 -rotate-6 items-center justify-center rounded-[10px] bg-gradient-to-br from-amber to-[#ffb02e] text-lg shadow-glow">🂡</span>
          <span className="font-display text-xl font-extrabold tracking-tight">StudySync</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-cloud">Create your account</h1>
        <p className="mb-6 mt-1 text-sm text-cloud-muted">Start building smarter study decks.</p>

        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-coral/15 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <div className="mb-4">
          <label className="rc-label" htmlFor="name">Name</label>
          <input id="name" type="text" required value={form.name} onChange={update('name')} className="rc-input" />
        </div>
        <div className="mb-4">
          <label className="rc-label" htmlFor="email">Email</label>
          <input id="email" type="email" required value={form.email} onChange={update('email')} className="rc-input" />
        </div>
        <div className="mb-6">
          <label className="rc-label" htmlFor="password">Password</label>
          <input id="password" type="password" required minLength={8} value={form.password} onChange={update('password')} className="rc-input" />
        </div>

        <button type="submit" disabled={submitting} className="rc-btn-amber w-full">
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="mt-5 text-center text-sm text-cloud-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
