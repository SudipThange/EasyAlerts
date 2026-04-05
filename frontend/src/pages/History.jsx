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

const formatConfidence = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${Math.round(parsed)}%` : '-';
};

const sanitizePdfText = (value) =>
  String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const wrapPdfText = (value, maxLength = 88) => {
  const normalized = sanitizePdfText(value);

  if (!normalized) {
    return ['-'];
  }

  if (normalized.length <= maxLength) {
    return [normalized];
  }

  const words = normalized.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if (!currentLine) {
      currentLine = word;
      return;
    }

    const nextLine = `${currentLine} ${word}`;

    if (nextLine.length <= maxLength) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const buildPdfDocument = (pageStreams) => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  ];
  const pageObjectNumbers = [];

  pageStreams.forEach((stream) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = objects.length + 2;

    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  objects[1] = `<< /Type /Pages /Count ${pageStreams.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
};

const buildReportPdf = (records) => {
  const generatedAt = new Date();
  const hazardCount = records.filter((record) => normalizeResult(record.prediction_label) === 'hazard').length;
  const safeCount = records.length - hazardCount;
  const averageConfidence = records.length
    ? Math.round(
        records.reduce((sum, record) => sum + (Number(record.confidence_score) || 0), 0) / records.length,
      )
    : 0;
  const pageWidth = 595;
  const leftMargin = 48;
  const rightMargin = 48;
  const topMargin = 794;
  const bottomMargin = 52;
  const contentRight = pageWidth - rightMargin;
  const pages = [];
  let currentPage = { commands: [], y: topMargin };

  const createPage = () => {
    currentPage = { commands: [], y: topMargin };
    pages.push(currentPage);
  };

  const ensureSpace = (requiredHeight = 16) => {
    if (currentPage.y - requiredHeight < bottomMargin) {
      createPage();
    }
  };

  const addTextLines = ({ lines, x = leftMargin, font = 'F1', size = 12, lineHeight = 16 }) => {
    ensureSpace(lines.length * lineHeight);

    lines.forEach((line, index) => {
      const y = currentPage.y - index * lineHeight;
      currentPage.commands.push(`BT\n/${font} ${size} Tf\n1 0 0 1 ${x} ${y} Tm\n(${sanitizePdfText(line) || '-'}) Tj\nET`);
    });

    currentPage.y -= lines.length * lineHeight;
  };

  const addWrappedText = ({ text, maxLength = 88, x = leftMargin, font = 'F1', size = 12, lineHeight = 16 }) => {
    addTextLines({ lines: wrapPdfText(text, maxLength), x, font, size, lineHeight });
  };

  const addGap = (size = 10) => {
    ensureSpace(size);
    currentPage.y -= size;
  };

  const addDivider = () => {
    ensureSpace(12);
    currentPage.commands.push(`0.75 w\n${leftMargin} ${currentPage.y} m\n${contentRight} ${currentPage.y} l\nS`);
    currentPage.y -= 12;
  };

  createPage();

  addTextLines({
    lines: ['EasyAlerts Smart Detection'],
    font: 'F2',
    size: 11,
    lineHeight: 14,
  });
  addTextLines({
    lines: ['Detection History Report'],
    font: 'F2',
    size: 24,
    lineHeight: 28,
  });
  addWrappedText({
    text: 'Structured PDF export of the selected history records for hazard review, follow-up analysis, and audit sharing.',
    maxLength: 84,
    size: 11,
    lineHeight: 15,
  });
  addGap(10);
  addTextLines({
    lines: [
      `Generated: ${formatReportDateTime(generatedAt)}`,
      `Selected rows: ${records.length}    Hazards: ${hazardCount}    Safe: ${safeCount}    Avg confidence: ${averageConfidence}%`,
    ],
    size: 11,
    lineHeight: 15,
  });
  addGap(8);
  addDivider();
  addTextLines({
    lines: ['Selected Records'],
    font: 'F2',
    size: 14,
    lineHeight: 18,
  });
  addGap(4);

  records.forEach((record, index) => {
    const resultLabel = normalizeResult(record.prediction_label) === 'hazard' ? 'Hazard' : 'Safe';
    const recordHeader = `${index + 1}. ${formatReportDateTime(record.timestamp)} | ${resultLabel} | Confidence ${formatConfidence(record.confidence_score)}`;
    const sensorLine = `Gas: ${record.gas_level ?? '-'}   Temp: ${record.temperature ?? '-'}   Pressure: ${record.pressure ?? '-'}   Smoke: ${record.smoke_level ?? '-'}`;
    const estimatedHeight = wrapPdfText(recordHeader, 76).length * 15 + wrapPdfText(sensorLine, 88).length * 13 + 18;

    ensureSpace(estimatedHeight);
    addWrappedText({
      text: recordHeader,
      maxLength: 76,
      font: 'F2',
      size: 12,
      lineHeight: 15,
    });
    addWrappedText({
      text: sensorLine,
      maxLength: 88,
      font: 'F3',
      size: 10,
      lineHeight: 13,
    });
    addGap(6);
    addDivider();
  });

  addGap(4);
  addTextLines({
    lines: ['Review Note'],
    font: 'F2',
    size: 12,
    lineHeight: 16,
  });
  addWrappedText({
    text: 'Review hazard-labelled rows first and compare their sensor patterns with safe readings before sharing or archiving this PDF.',
    maxLength: 88,
    size: 11,
    lineHeight: 15,
  });

  const pageStreams = pages.map((page, index) =>
    [
      ...page.commands,
      `BT\n/F1 10 Tf\n1 0 0 1 ${leftMargin} 28 Tm\n(Page ${index + 1} of ${pages.length}) Tj\nET`,
    ].join('\n'),
  );

  return buildPdfDocument(pageStreams);
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
  const selectedHistoryRows = sortedHistory.filter((item, index) =>
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

    const blob = buildReportPdf(selectedHistoryRows);
    const fileUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const timestamp = new Date().toISOString().replaceAll(':', '-');

    downloadLink.href = fileUrl;
    downloadLink.download = `easyalerts-history-report-${timestamp}.pdf`;
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
                          Select the rows you want in the exported report, then download a PDF document.
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
                          Download selected PDF
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
