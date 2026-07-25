import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReviews } from '../api/performance';

export default function PerformanceReviewList() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getReviews({ status: statusFilter || undefined });
      setReviews(data.reviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const statusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-600',
      submitted: 'bg-blue-50 text-blue-700',
      acknowledged: 'bg-green-50 text-green-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Performance Reviews</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
          <Link
            to="/performance/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Review
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Period</th>
              <th className="px-4 py-3 font-medium">Reviewer</th>
              <th className="px-4 py-3 font-medium">Overall Rating</th>
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
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No reviews found.
                </td>
              </tr>
            ) : (
              reviews.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {r.employee?.user?.firstName} {r.employee?.user?.lastName}
                    <div className="text-xs text-slate-400">{r.employee?.department}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.reviewPeriod}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.reviewer?.firstName} {r.reviewer?.lastName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {r.overallRating ? `${r.overallRating} / 5` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/performance/${r._id}/edit`} className="text-blue-600 hover:underline">
                      {r.status === 'draft' ? 'Edit' : 'View'}
                    </Link>
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