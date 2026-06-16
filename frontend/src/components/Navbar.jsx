import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/sessions', label: 'Sessions' },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Link to="/" className="text-lg font-bold text-brand-600">
        StudySync
      </Link>
      {isAuthenticated && (
        <div className="flex items-center gap-4">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-slate-600 hover:text-brand-600"
            >
              {l.label}
            </Link>
          ))}
          <span className="text-sm text-slate-400">|</span>
          <span className="hidden text-sm text-slate-600 sm:inline">Hi, {user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
