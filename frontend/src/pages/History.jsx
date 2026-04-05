import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { buildApiUrl } from '../config/api';

const ROWS_PER_PAGE = 7;

const initialFilters = {
  result: 'all',
  confidenceMin: '',
  confidenceMax: '',
  recordedAt: '',
};

const tableColumns = [
  { key: 'gas_level', label: 'Gas', sortable: true },
  { key: 'temperature', label: 'Temp', sortable: true },
  { key: 'pressure', label: 'Pressure', sortable: true },
  { key: 'smoke_level', label: 'Smoke', sortable: true },
  { key: 'result', label: 'Result', sortable: false },
  { key: 'confidence_score', label: 'Confidence', sortable: true },
  { key: 'timestamp', label: 'Recorded At', sortable: false },
];

const normalizeResult = (value) => (value || '').trim().toLowerCase();

const getHistoryRowKey = (item, index = 0) =>
  item.id ?? `${item.timestamp}-${item.gas_level}-${item.temperature}-${item.pressure}-${item.smoke_level}-${index}`;

const formatTableDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatReportDateTime = (timestamp) =>
  new Date(timestamp).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatDateInputValue = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseConfidenceValue = (value) => {
  if (value === '' || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const buildReportMarkup = (records) => {
  const generatedAt = new Date();
  const hazardCount = records.filter((record) => normalizeResult(record.prediction_label) === 'hazard').length;
  const safeCount = records.length - hazardCount;
  const averageConfidence = records.length
    ? Math.round(
        records.reduce((sum, record) => sum + (Number(record.confidence_score) || 0), 0) / records.length,
      )
    : 0;

  const rows = records
    .map(
      (record, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(formatReportDateTime(record.timestamp))}</td>
          <td>${escapeHtml(record.gas_level)}</td>
          <td>${escapeHtml(record.temperature)}</td>
          <td>${escapeHtml(record.pressure)}</td>
          <td>${escapeHtml(record.smoke_level)}</td>
          <td>${escapeHtml(normalizeResult(record.prediction_label) === 'hazard' ? 'Hazard' : 'Safe')}</td>
          <td>${record.confidence_score != null ? `${Math.round(record.confidence_score)}%` : '-'}</td>
        </tr>
      `,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EasyAlerts Detection History Report</title>
    <style>
      :root {
        --ink: #0f172a;
        --muted: #64748b;
        --line: #dbe4f0;
        --panel: #f8fbff;
        --accent: #2563eb;
        --danger: #dc2626;
        --safe: #059669;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        padding: 32px;
        font-family: "IBM Plex Sans", Arial, sans-serif;
        color: var(--ink);
        background: linear-gradient(180deg, #fffcf7 0%, #f4f8ff 100%);
      }

      .report-shell {
        max-width: 980px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid var(--line);
        border-radius: 28px;
        padding: 32px;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
      }

      .report-header {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 10px;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        font-size: 12px;
        color: var(--accent);
      }

      h1 {
        margin: 0;
        font-size: 40px;
        line-height: 1;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .subtext {
        margin: 12px 0 0;
        max-width: 520px;
        color: var(--muted);
        line-height: 1.6;
      }

      .stamp {
        min-width: 220px;
        padding: 18px 20px;
        border-radius: 20px;
        background: var(--panel);
        border: 1px solid var(--line);
      }

      .stamp strong,
      .summary-card strong {
        display: block;
        font-size: 12px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 8px;
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin: 24px 0 28px;
      }

      .summary-card {
        padding: 18px;
        border-radius: 20px;
        border: 1px solid var(--line);
        background: var(--panel);
      }

      .summary-card span {
        font-size: 28px;
        font-weight: 700;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        overflow: hidden;
        border-radius: 20px;
      }

      thead th {
        background: #eef5ff;
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 11px;
      }

      th,
      td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid var(--line);
        font-size: 14px;
      }

      tbody tr:nth-child(even) {
        background: #fbfdff;
      }

      .hazard {
        color: var(--danger);
        font-weight: 700;
      }

      .safe {
        color: var(--safe);
        font-weight: 700;
      }

      .note {
        margin-top: 20px;
        padding: 18px 20px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #fffef8;
        color: var(--muted);
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main class="report-shell">
      <section class="report-header">
        <div>
          <p class="eyebrow">EasyAlerts Smart Detection</p>
          <h1>Detection Report</h1>
          <p class="subtext">
            Structured export of the selected history records for hazard review, follow-up analysis, and audit sharing.
          </p>
        </div>
        <aside class="stamp">
          <strong>Generated</strong>
          <div>${escapeHtml(formatReportDateTime(generatedAt))}</div>
        </aside>
      </section>

      <section class="summary-grid">
        <article class="summary-card">
          <strong>Selected Rows</strong>
          <span>${records.length}</span>
        </article>
        <article class="summary-card">
          <strong>Hazards</strong>
          <span class="hazard">${hazardCount}</span>
        </article>
        <article class="summary-card">
          <strong>Safe</strong>
          <span class="safe">${safeCount}</span>
        </article>
        <article class="summary-card">
          <strong>Avg Confidence</strong>
          <span>${averageConfidence}%</span>
        </article>
      </section>

      <section>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Recorded At</th>
              <th>Gas</th>
              <th>Temp</th>
              <th>Pressure</th>
              <th>Smoke</th>
              <th>Result</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>

      <section class="note">
        This report was generated from the selected history rows inside EasyAlerts. Review hazard-labelled rows first and compare
        their sensor patterns against normal safe readings before sharing or archiving the document.
      </section>
    </main>
  </body>
</html>`;
};

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [reportMode, setReportMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await axios.get(buildApiUrl('/users/history/'), {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const filteredHistory = history.filter((item) => {
    const result = normalizeResult(item.prediction_label);
    const confidence = item.confidence_score != null ? Number(item.confidence_score) : null;
    const confidenceFrom = parseConfidenceValue(filters.confidenceMin);
    const confidenceTo = parseConfidenceValue(filters.confidenceMax);

    if (filters.result !== 'all' && result !== filters.result) {
      return false;
    }

    if (confidenceFrom != null && (confidence == null || confidence < confidenceFrom)) {
      return false;
    }

    if (confidenceTo != null && (confidence == null || confidence > confidenceTo)) {
      return false;
    }

    if (filters.recordedAt && formatDateInputValue(item.timestamp) !== filters.recordedAt) {
      return false;
    }

    return true;
  });

  const sortedHistory = [...filteredHistory].sort((left, right) => {
    if (!sortConfig.key) {
      return 0;
    }

    const leftValue = Number(left[sortConfig.key] ?? Number.NEGATIVE_INFINITY);
    const rightValue = Number(right[sortConfig.key] ?? Number.NEGATIVE_INFINITY);

    if (leftValue === rightValue) {
      return 0;
    }

    const sortResult = leftValue < rightValue ? -1 : 1;
    return sortConfig.direction === 'asc' ? sortResult : sortResult * -1;
  });

  const totalPages = Math.max(1, Math.ceil(sortedHistory.length / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const paginatedHistory = sortedHistory.slice(pageStart, pageStart + ROWS_PER_PAGE);
  const currentPageKeys = paginatedHistory.map((item, index) => getHistoryRowKey(item, pageStart + index));
  const allCurrentPageSelected =
    currentPageKeys.length > 0 && currentPageKeys.every((key) => selectedRows.includes(key));
  const selectedHistoryRows = history.filter((item, index) =>
    selectedRows.includes(getHistoryRowKey(item, index)),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.result, filters.confidenceMin, filters.confidenceMax, filters.recordedAt, sortConfig.key, sortConfig.direction]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
  };

  const handleSort = (columnKey) => {
    setSortConfig((current) => {
      if (current.key === columnKey) {
        return {
          key: columnKey,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return { key: columnKey, direction: 'asc' };
    });
  };

  const handleToggleReportMode = () => {
    setReportMode((current) => !current);
    setSelectedRows([]);
  };

  const handleRowSelection = (rowKey) => {
    setSelectedRows((current) =>
      current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey],
    );
  };

  const handleCurrentPageSelection = () => {
    setSelectedRows((current) => {
      if (allCurrentPageSelected) {
        return current.filter((key) => !currentPageKeys.includes(key));
      }

      const next = new Set(current);
      currentPageKeys.forEach((key) => next.add(key));
      return Array.from(next);
    });
  };

  const handleDownloadReport = () => {
    if (selectedHistoryRows.length === 0) {
      return;
    }

    const reportMarkup = buildReportMarkup(selectedHistoryRows);
    const blob = new Blob([reportMarkup], { type: 'text/html;charset=utf-8' });
    const fileUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const timestamp = new Date().toISOString().replaceAll(':', '-');

    downloadLink.href = fileUrl;
    downloadLink.download = `easyalerts-history-report-${timestamp}.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(fileUrl);
  };

  return (
    <div className="min-h-screen pt-20">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 font-alert text-5xl uppercase tracking-[0.06em] text-slate-900">Detection History</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              All your past hazard detection records from submitted sensor readings.
            </p>
          </div>

          {history.length > 0 && !loading && !error ? (
            <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
              <button
                type="button"
                onClick={handleToggleReportMode}
                className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  reportMode
                    ? 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    : 'bg-slate-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] hover:bg-slate-800'
                }`}
              >
                {reportMode ? 'Cancel report mode' : 'Download report'}
              </button>
            </div>
          ) : null}
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
            <div className="grid gap-0 xl:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="border-b border-info/10 bg-white/80 p-4 xl:border-b-0 xl:border-r">
                <div className="sticky top-24">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-info">Column Filters</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-500">
                      Filter by result, confidence, and recorded date. Numeric columns can now be sorted directly from the table.
                    </p>
                  </div>

                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-info/10 bg-info/5 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-info">
                      {filteredHistory.length} matching rows
                    </span>
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <label className="block rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Result</span>
                      <select
                        value={filters.result}
                        onChange={(event) => handleFilterChange('result', event.target.value)}
                        className="w-full bg-transparent text-[15px] text-slate-700 outline-none"
                      >
                        <option value="all">All results</option>
                        <option value="hazard">Hazard</option>
                        <option value="safe">Safe</option>
                      </select>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <label className="block rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">From %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          inputMode="numeric"
                          value={filters.confidenceMin}
                          onChange={(event) => handleFilterChange('confidenceMin', event.target.value)}
                          placeholder="0"
                          className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </label>
                      <label className="block rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">To %</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          inputMode="numeric"
                          value={filters.confidenceMax}
                          onChange={(event) => handleFilterChange('confidenceMax', event.target.value)}
                          placeholder="100"
                          className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
                        />
                      </label>
                    </div>
                    <label className="block rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Recorded At</span>
                      <input
                        type="date"
                        value={filters.recordedAt}
                        onChange={(event) => handleFilterChange('recordedAt', event.target.value)}
                        className="w-full bg-transparent text-[15px] text-slate-700 outline-none"
                      />
                    </label>
                  </div>
                </div>
              </aside>

              <section className="min-w-0">
                {reportMode ? (
                  <div className="border-b border-info/10 bg-slate-900 px-6 py-5 text-white">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Report Builder</p>
                        <p className="mt-1 text-sm text-slate-200">
                          Select the rows you want in the exported report, then download a structured document.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white">
                          {selectedHistoryRows.length} selected
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadReport}
                          disabled={selectedHistoryRows.length === 0}
                          className="rounded-full bg-warning px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
                        >
                          Download selected report
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {filteredHistory.length === 0 ? (
                  <div className="px-6 py-20 text-center">
                    <div className="mx-auto max-w-lg rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-6 py-10">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-info">No Matches</p>
                      <p className="mt-3 font-alert text-4xl uppercase tracking-[0.08em] text-slate-900">Refine Filters</p>
                      <p className="mt-3 text-sm text-slate-500">
                        No history rows match the current filters. Adjust the search values or clear the filters to see more records.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden">
                      <table className="w-full table-fixed">
                      <thead>
                        <tr className="border-b border-info/10 bg-info/5">
                          {reportMode ? (
                            <th className="w-[7%] px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.2em] text-info">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={allCurrentPageSelected}
                                  onChange={handleCurrentPageSelection}
                                  className="h-4 w-4 rounded border-slate-300 text-info focus:ring-info"
                                />
                                <span>Select</span>
                              </label>
                            </th>
                          ) : null}
                          {tableColumns.map((column) => (
                            <th
                              key={column.key}
                              className={`px-3 py-3 text-left text-[11px] font-medium uppercase tracking-[0.2em] text-info ${
                                column.key === 'result'
                                  ? 'w-[14%]'
                                  : column.key === 'confidence_score'
                                    ? 'w-[14%]'
                                    : column.key === 'timestamp'
                                      ? 'w-[18%]'
                                      : 'w-[12%]'
                              }`}
                            >
                              {column.sortable ? (
                                <button
                                  type="button"
                                  onClick={() => handleSort(column.key)}
                                  className="inline-flex items-center gap-1.5 text-left text-[11px] font-medium uppercase tracking-[0.2em] text-info transition-opacity hover:opacity-80"
                                >
                                  <span>{column.label}</span>
                                  <span className="flex flex-col leading-[0.75]">
                                    <span className={sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'text-slate-900' : 'text-info/40'}>
                                      ▲
                                    </span>
                                    <span className={sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'text-slate-900' : 'text-info/40'}>
                                      ▼
                                    </span>
                                  </span>
                                </button>
                              ) : (
                                column.label
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedHistory.map((item, index) => {
                          const rowKey = getHistoryRowKey(item, pageStart + index);
                          const isSelected = selectedRows.includes(rowKey);

                          return (
                            <tr
                              key={rowKey}
                              className={`border-b border-slate-100 transition-colors hover:bg-info/5 ${isSelected ? 'bg-warning/5' : ''}`}
                            >
                              {reportMode ? (
                                <td className="px-3 py-4">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleRowSelection(rowKey)}
                                    className="h-4 w-4 rounded border-slate-300 text-info focus:ring-info"
                                  />
                                </td>
                              ) : null}
                              <td className="px-3 py-4">
                                <span className="font-mono text-sm font-semibold text-slate-900">{item.gas_level}</span>
                              </td>
                              <td className="px-3 py-4">
                                <span className="font-mono text-sm text-slate-600">{item.temperature}</span>
                              </td>
                              <td className="px-3 py-4">
                                <span className="font-mono text-sm text-slate-600">{item.pressure}</span>
                              </td>
                              <td className="px-3 py-4">
                                <span className="font-mono text-sm text-slate-600">{item.smoke_level}</span>
                              </td>
                              <td className="px-3 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                                    normalizeResult(item.prediction_label) === 'hazard'
                                      ? 'border-danger/15 bg-danger/5 text-danger'
                                      : 'border-safe/15 bg-safe/5 text-safe'
                                  }`}
                                >
                                  {normalizeResult(item.prediction_label) === 'hazard' ? 'Hazard' : 'Safe'}
                                </span>
                              </td>
                              <td className="px-3 py-4">
                                {item.confidence_score != null ? (
                                  <span className="font-mono text-sm text-slate-600">{Math.round(item.confidence_score)}%</span>
                                ) : (
                                  <span className="font-mono text-sm text-slate-400">-</span>
                                )}
                              </td>
                              <td className="px-3 py-4">
                                <span className="block max-w-[110px] whitespace-normal font-mono text-sm text-slate-500">
                                  {formatTableDate(item.timestamp)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
                      <div className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{pageStart + 1}</span> to{' '}
                        <span className="font-semibold text-slate-900">{pageStart + paginatedHistory.length}</span> of{' '}
                        <span className="font-semibold text-slate-900">{filteredHistory.length}</span> rows
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                          disabled={safeCurrentPage === 1}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                          <button
                            key={pageNumber}
                            type="button"
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-colors ${
                              pageNumber === safeCurrentPage
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                          disabled={safeCurrentPage === totalPages}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
