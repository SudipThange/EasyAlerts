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
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-info/10 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-6 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/easyalerts_logo_clean.png"
            alt="EasyAlerts logo"
            className="h-12 w-12 rounded-2xl object-contain shadow-[0_10px_30px_rgba(37,99,235,0.18)]"
          />
          <div>
            <span className="block font-alert text-2xl uppercase tracking-[0.12em] leading-none text-slate-900">EasyAlerts</span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-500">Smart detection</span>
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
                className={navLinkClass(location.pathname === '/login')}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-info px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Register
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
                className="text-sm text-slate-500 transition-colors hover:text-danger"
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
