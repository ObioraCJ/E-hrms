import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { downloadReport } from '../api/reports';

export default function Reports() {
  const { user } = useAuth();
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [error, setError] = useState('');

  const canViewSensitive = user?.role === 'super_admin' || user?.role === 'hr_manager';

  const reports = [
    { type: 'employees', label: 'Employees', show: canViewSensitive, hasFilters: false },
    { type: 'departments', label: 'Departments', show: canViewSensitive, hasFilters: false },
    { type: 'attendance', label: 'Attendance', show: true, hasFilters: 'month' },
    { type: 'leave', label: 'Leave', show: true, hasFilters: 'status' },
    { type: 'payroll', label: 'Payroll', show: canViewSensitive, hasFilters: 'month' },
  ].filter((r) => r.show);

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: '',
  });

  // Triggers an actual file download in the browser from a Blob
  // response. This is more involved than a plain <a href> link because
  // the request needs our auth token attached (handled automatically
  // by our axios instance) - a raw link tag can't send that header.
  const triggerDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = async (type, format, hasFilters) => {
    const key = `${type}-${format}`;
    setDownloadingKey(key);
    setError('');

    try {
      const params = { format };
      if (hasFilters === 'month') {
        params.month = filters.month;
        params.year = filters.year;
      }
      if (hasFilters === 'status' && filters.status) {
        params.status = filters.status;
      }

      const response = await downloadReport(type, params);
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      triggerDownload(response.data, `${type}-report.${extension}`);
    } catch (err) {
      // The error response itself is also a Blob (since we requested
      // responseType: 'blob' for the whole request) - we need to read
      // it as text and parse it as JSON to get the actual error message,
      // rather than showing "[object Blob]" to the user.
      if (err.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text);
          setError(parsed.message || 'Failed to download report');
        } catch {
          setError('Failed to download report');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to download report');
      }
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Reports</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Month</label>
          <select
            value={filters.month}
            onChange={(e) => setFilters((prev) => ({ ...prev, month: Number(e.target.value) }))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString(undefined, { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Year</label>
          <input
            type="number"
            value={filters.year}
            onChange={(e) => setFilters((prev) => ({ ...prev, year: Number(e.target.value) }))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Leave Status (optional)
          </label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <p className="text-xs text-slate-400">
          Month/Year applies to Attendance &amp; Payroll. Status applies to Leave only.
        </p>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.type}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
          >
            <span className="font-medium text-slate-900">{report.label} Report</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(report.type, 'excel', report.hasFilters)}
                disabled={downloadingKey === `${report.type}-excel`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {downloadingKey === `${report.type}-excel` ? 'Downloading...' : 'Excel'}
              </button>
              <button
                onClick={() => handleDownload(report.type, 'pdf', report.hasFilters)}
                disabled={downloadingKey === `${report.type}-pdf`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {downloadingKey === `${report.type}-pdf` ? 'Downloading...' : 'PDF'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}