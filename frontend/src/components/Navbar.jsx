import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/import', label: 'Import' },
  { to: '/assistant', label: 'Assistant' },
];

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-ink/80 px-6 py-3 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 -rotate-6 items-center justify-center rounded-[9px] bg-gradient-to-br from-amber to-[#ffb02e] text-base shadow-glow">
          🂡
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight text-cloud">
          StudySync
        </span>
      </Link>
      {isAuthenticated && (
        <div className="flex items-center gap-1 sm:gap-2">
          {LINKS.map((l) => {
            const active = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`hidden rounded-pill px-3 py-1.5 text-sm font-medium transition sm:block ${
                  active ? 'bg-white/[0.07] text-cloud' : 'text-cloud-muted hover:text-cloud'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 rounded-pill border border-white/10 bg-ink-soft px-3 py-1.5 text-sm font-medium text-cloud-muted transition hover:bg-ink-soft2 hover:text-cloud"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}
