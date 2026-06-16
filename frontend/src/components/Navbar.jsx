import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
          <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            Dashboard
          </Link>
          <Link to="/subjects" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            Subjects
          </Link>
          <span className="text-sm text-slate-400">|</span>
          <span className="text-sm text-slate-600">Hi, {user?.name}</span>
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
