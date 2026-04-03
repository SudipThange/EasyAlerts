import { useEffect, useState } from 'react';
import axios from 'axios';

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/users/history/`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setHistory(res.data);
      } catch (err) {
        console.error('Failed to load history:', err);
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
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Detection History</h1>
          <p className="text-sm text-slate-600">All your past hazard detection records from submitted sensor readings.</p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <svg className="h-6 w-6 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : history.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mb-4 text-5xl">History</div>
              <p className="text-sm text-slate-600">No detections yet.</p>
              <p className="mt-1 text-xs text-slate-400">Run your first hazard check to see results here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70">
                    {['Gas', 'Temp', 'Pressure', 'Smoke', 'Result', 'Confidence', 'Recorded At'].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <tr key={item.id || index} className="border-b border-slate-100 transition-colors hover:bg-amber-50/50">
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900">{item.gas_level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.temperature}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.pressure}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{item.smoke_level}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                            item.prediction_label === 'hazard'
                              ? 'border-rose-200 bg-rose-50 text-rose-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {item.prediction_label === 'hazard' ? 'Hazard' : 'Safe'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.confidence_score != null ? (
                          <span className="text-sm text-slate-600">{Math.round(item.confidence_score)}%</span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
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
