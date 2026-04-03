import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = (isActive) =>
    `text-sm transition-colors ${
      isActive
        ? 'font-semibold text-slate-900'
        : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-amber-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-[0_10px_30px_rgba(251,146,60,0.28)]">
            <span className="text-xs font-bold text-white">EA</span>
          </div>
          <div>
            <span className="block text-base font-semibold text-slate-900">EasyAlerts</span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-400">Smart detection</span>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <Link
                to="/"
                className={navLinkClass(location.pathname === '/' && location.hash !== '#how-it-works')}
              >
                Home
              </Link>
              <Link
                to="/#how-it-works"
                className={navLinkClass(
                  (location.pathname === '/' && location.hash === '#how-it-works') ||
                    location.pathname === '/how-to-use',
                )}
              >
                How to Use
              </Link>
              <Link
                to="/login"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                Login
              </Link>
            </>
          ) : (
            <>
              <Link to="/detect" className={navLinkClass(location.pathname === '/detect')}>
                Detect Hazard
              </Link>
              <Link to="/history" className={navLinkClass(location.pathname === '/history')}>
                History
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 transition-colors hover:text-rose-500"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
