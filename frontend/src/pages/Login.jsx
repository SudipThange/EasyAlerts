import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../config/api';
import PasswordField from '../components/PasswordField';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(() => location.state?.message || '');
  const { login } = useAuth();
  const redirectPath = location.state?.from?.pathname || '/detect';

  useEffect(() => {
    if (!location.state?.message) return undefined;

    const timerId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 5000);

    navigate(location.pathname, {
      replace: true,
      state: location.state?.from ? { from: location.state.from } : null,
    });

    return () => {
      window.clearTimeout(timerId);
    };
  }, [location.pathname, location.state?.from, location.state?.message, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(buildApiUrl('/users/login/'), form);
      login(res.data.access, res.data.refresh);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      const firstFieldError = apiErrors
        ? Object.values(apiErrors).flat().find(Boolean)
        : null;

      setError(firstFieldError || err.response?.data?.message || err.response?.data?.detail || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6 pt-20">
      <div className="w-full max-w-md">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
          <div className="mb-8 text-center">
            <img
              src="/easyalerts_logo_clean.png"
              alt="EasyAlerts logo"
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
            />
            <h2 className="font-alert text-4xl uppercase tracking-[0.08em] text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">Login to your EasyAlerts account</p>
          </div>

          {successMessage && (
            <div className="mb-6 rounded-2xl border border-safe/15 bg-safe/5 px-4 py-3">
              <p className="text-sm text-safe">{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-600">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-info"
              />
            </div>
            <PasswordField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="........"
              required
              autoComplete="current-password"
              inputClassName="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-info"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-info py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-info transition-colors hover:text-blue-700">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
