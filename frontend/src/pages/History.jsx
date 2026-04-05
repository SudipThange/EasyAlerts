import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../config/api';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          buildApiUrl('/users/history/'),
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setHistory(res.data);
        setError('');
      } catch (err) {
        console.error('Failed to load history:', err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            'Unable to load your history right now. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mb-2 font-alert text-5xl uppercase tracking-[0.06em] text-slate-900">Detection History</h1>
          <p className="text-sm text-slate-600">All your past hazard detection records from submitted sensor readings.</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-info/10 bg-white/85 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="h-6 w-6 animate-spin text-info" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <div className="mx-auto mb-5 max-w-md rounded-2xl border border-danger/15 bg-danger/5 px-5 py-4">
                <p className="text-sm text-danger">{error}</p>
              </div>
              <Link
                to="/detect"
                className="inline-flex rounded-full bg-info px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Go to Detect Hazard
              </Link>
            </div>
          ) : history.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mb-4 font-alert text-6xl uppercase tracking-[0.08em] text-warning">History</div>
              <p className="text-sm text-slate-600">No detections yet.</p>
              <p className="mt-1 text-xs text-slate-400">Run your first hazard check to see results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-info/10 bg-info/5">
                    {['Gas', 'Temp', 'Pressure', 'Smoke', 'Result', 'Confidence', 'Recorded At'].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-[0.24em] text-info"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-100 transition-colors hover:bg-info/5">
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-slate-900">{item.gas_level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">{item.temperature}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">{item.pressure}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">{item.smoke_level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                            item.prediction_label === 'hazard'
                              ? 'border-danger/15 bg-danger/5 text-danger'
                              : 'border-safe/15 bg-safe/5 text-safe'
                          }`}
                        >
                          {item.prediction_label === 'hazard' ? 'Hazard' : 'Safe'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.confidence_score != null ? (
                          <span className="font-mono text-sm text-slate-600">{Math.round(item.confidence_score)}%</span>
                        ) : (
                          <span className="font-mono text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
