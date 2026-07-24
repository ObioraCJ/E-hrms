import { useState, useEffect } from 'react';
import { getAllLeaves, reviewLeave } from '../api/leave';

export default function LeaveManagement() {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getAllLeaves({ status: statusFilter || undefined });
      setLeaves(data.leaves);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleReview = async (id, status) => {
    const label = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${label} this request?`)) return;

    setReviewingId(id);
    try {
      await reviewLeave(id, { status });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${label} request`);
    } finally {
      setReviewingId(null);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700',
      approved: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-700',
      cancelled: 'bg-slate-100 text-slate-500',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Leave Management</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Days</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No leave requests found.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {leave.employee?.user?.firstName} {leave.employee?.user?.lastName}
                    <div className="text-xs text-slate-400">{leave.employee?.department}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{leave.leaveType}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(leave.startDate).toLocaleDateString()} –{' '}
                    {new Date(leave.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{leave.numberOfDays}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(leave.status)}>{leave.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {leave.status === 'pending' ? (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleReview(leave._id, 'approved')}
                          disabled={reviewingId === leave._id}
                          className="text-green-600 hover:text-green-700 hover:underline disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(leave._id, 'rejected')}
                          disabled={reviewingId === leave._id}
                          className="text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {leave.reviewedAt ? new Date(leave.reviewedAt).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}