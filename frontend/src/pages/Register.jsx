import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import PasswordField from '../components/PasswordField';

const getFirstErrorMessage = (errors) => {
  if (!errors) return null;

  const firstError = Object.values(errors).flat().find(Boolean);
  return typeof firstError === 'string' ? firstError : 'Please check the highlighted fields and try again.';
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    setFieldErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const response = await axios.post(buildApiUrl('/users/register/'), form);

      navigate('/login', {
        replace: true,
        state: {
          message: response.data?.message || 'Account created successfully. Please login.',
        },
      });
    } catch (err) {
      const apiErrors = err.response?.data?.errors || {};
      setFieldErrors(apiErrors);
      setError(
        getFirstErrorMessage(apiErrors) ||
          err.response?.data?.message ||
          err.response?.data?.detail ||
          'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (fieldName) =>
    `w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 ${
      fieldErrors[fieldName] ? 'border-danger/40 focus:border-danger' : 'border-slate-200 focus:border-info'
    }`;

  const renderFieldError = (fieldName) =>
    fieldErrors[fieldName] ? <p className="mt-1.5 text-xs text-danger">{fieldErrors[fieldName][0]}</p> : null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 pt-20">
      <div className="w-full max-w-2xl">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
          <div className="mb-8 text-center">
            <img
              src="/easyalerts_logo_clean.png"
              alt="EasyAlerts logo"
              className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain shadow-[0_12px_30px_rgba(37,99,235,0.18)]"
            />
            <h2 className="font-alert text-4xl uppercase tracking-[0.08em] text-slate-900">Create your account</h2>
            <p className="mt-1 text-sm text-slate-500">Register to start saving hazard detection history.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-danger/15 bg-danger/5 px-4 py-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-600">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Sudip"
                  required
                  className={inputClassName('first_name')}
                />
                {renderFieldError('first_name')}
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-600">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Sharma"
                  required
                  className={inputClassName('last_name')}
                />
                {renderFieldError('last_name')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-600">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className={inputClassName('email')}
                />
                {renderFieldError('email')}
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-600">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                  className={`${inputClassName('phone_number')} font-mono`}
                />
                {renderFieldError('phone_number')}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  inputClassName={`${inputClassName('password')} font-mono`}
                  helperText="Use uppercase, lowercase, number, and special character."
                />
                {renderFieldError('password')}
              </div>
              <div>
                <PasswordField
                  label="Confirm Password"
                  name="password_confirm"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  inputClassName={`${inputClassName('password_confirm')} font-mono`}
                />
                {renderFieldError('password_confirm')}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-info py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-info transition-colors hover:text-blue-700">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
