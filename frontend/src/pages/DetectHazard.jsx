import { useState } from 'react';
import axios from 'axios';

const DetectHazard = () => {
  const [form, setForm] = useState({
    gas_level: '',
    temperature: '',
    pressure: '',
    smoke_level: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/users/history/`,
        {
          gas_level: Number(form.gas_level),
          temperature: Number(form.temperature),
          pressure: Number(form.pressure),
          smoke_level: Number(form.smoke_level),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Detect Hazard</h1>
          <p className="text-sm text-slate-600">Enter sensor readings to run AI-powered hazard detection.</p>
        </div>

        <div className="mb-6 rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-slate-600">Gas Level</label>
              <input
                type="number"
                step="any"
                name="gas_level"
                value={form.gas_level}
                onChange={handleChange}
                placeholder="e.g. 10.5"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-amber-400"
              />
              <p className="mt-1.5 text-xs text-slate-500">Measured gas concentration value</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm text-slate-600">Temperature</label>
                <input
                  type="number"
                  step="any"
                  name="temperature"
                  value={form.temperature}
                  onChange={handleChange}
                  placeholder="e.g. 32.1"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-600">Pressure</label>
                <input
                  type="number"
                  step="any"
                  name="pressure"
                  value={form.pressure}
                  onChange={handleChange}
                  placeholder="e.g. 1012.3"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-600">Smoke Level</label>
              <input
                type="number"
                step="any"
                name="smoke_level"
                value={form.smoke_level}
                onChange={handleChange}
                placeholder="e.g. 2.7"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder-slate-400 focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing...
                </>
              ) : 'Run Detection'}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
            <h3 className="mb-5 text-base font-semibold text-slate-900">Detection Result</h3>
            <div
              className={`mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                result.history?.prediction_label === 'hazard'
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {result.history?.prediction_label === 'hazard' ? 'Hazard Detected' : 'No Hazard Found'}
            </div>

            {result.message && (
              <p className="text-sm leading-relaxed text-slate-600">{result.message}</p>
            )}

            {result.history && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Prediction</p>
                  <p className="mt-1 font-medium capitalize text-slate-900">{result.history.prediction_label}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recorded At</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {new Date(result.history.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            )}

            {result.history?.confidence_score != null && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-slate-500">Confidence</span>
                <div className="h-1.5 flex-1 rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-amber-500 transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, result.history.confidence_score))}%` }}
                  />
                </div>
                <span className="text-xs text-slate-600">{Math.round(result.history.confidence_score)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectHazard;
