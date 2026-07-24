import { useState, useEffect } from 'react';
import { applyLeave, cancelLeave, getMyLeaves, getMyBalance } from '../api/leave';

const LEAVE_TYPES = ['annual', 'sick', 'casual', 'maternity', 'paternity'];

export default function MyLeave() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [leavesRes, balanceRes] = await Promise.all([getMyLeaves(), getMyBalance()]);
      setLeaves(leavesRes.data.leaves);
      setBalance(balanceRes.data.balance);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leave data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      await applyLeave({ leaveType, startDate, endDate, reason });
      setStartDate('');
      setEndDate('');
      setReason('');
      fetchData(); // refresh both the history table and the balance
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to submit leave request';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await cancelLeave(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel request');
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

  if (loading) {
    return <p className="text-slate-400">Loading...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">My Leave</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Leave balance cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {balance.map((b) => (
          <div key={b.leaveType} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs capitalize text-slate-500">{b.leaveType}</p>
            <p className="mt-1 text-2xl font-semibold text-blue-600">{b.remaining}</p>
            <p className="text-xs text-slate-400">of {b.allocated} days left</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Apply for leave */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Apply for Leave</h2>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label htmlFor="leaveType" className="mb-1 block text-sm font-medium text-slate-700">
                Leave Type
              </label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-slate-700">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-slate-700">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium text-slate-700">
                Reason (optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* Leave history */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">My Requests</h2>
          {leaves.length === 0 ? (
            <p className="text-sm text-slate-400">No leave requests yet.</p>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div
                  key={leave._id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-900">
                      {leave.leaveType} · {leave.numberOfDays} day{leave.numberOfDays !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(leave.startDate).toLocaleDateString()} –{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={statusBadge(leave.status)}>{leave.status}</span>
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(leave._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}