import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAttendance, deleteAttendance } from '../api/attendance';
import { useAuth } from '../context/AuthContext';

export default function AttendanceList() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = user?.role === 'super_admin' || user?.role === 'hr_manager';
  const canDelete = user?.role === 'super_admin';

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAttendance({ date: dateFilter || undefined });
      setRecords(data.attendance);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [dateFilter]);

   const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete this attendance record for ${name}?`)) return;
    try {
      await deleteAttendance(id);
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const statusBadge = (status) => {
    const styles = {
      present: 'bg-green-50 text-green-700',
      late: 'bg-yellow-50 text-yellow-700',
      'half-day': 'bg-orange-50 text-orange-700',
      absent: 'bg-red-50 text-red-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  const formatTime = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—';

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
        {canManage && (
          <Link
            to="/attendance/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Record
          </Link>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label htmlFor="dateFilter" className="text-sm text-slate-600">
          Filter by date:
        </label>
        <input
          id="dateFilter"
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Clock In</th>
              <th className="px-4 py-3 font-medium">Clock Out</th>
              <th className="px-4 py-3 font-medium">Hours</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((rec) => (
                <tr key={rec._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {rec.employee?.user?.firstName} {rec.employee?.user?.lastName}
                    <div className="text-xs text-slate-400">{rec.employee?.employeeId}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(rec.date)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(rec.clockIn)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatTime(rec.clockOut)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {rec.workingHours != null ? `${rec.workingHours}h` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(rec.status)}>{rec.status}</span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/attendance/${rec._id}/edit`}
                        className="mr-3 text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Edit
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() =>
                            handleDelete(rec._id, `${rec.employee?.user?.firstName} ${rec.employee?.user?.lastName}`)
                          }
                          className="text-red-600 hover:text-red-700 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}