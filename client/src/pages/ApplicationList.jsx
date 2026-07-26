import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getApplications } from '../api/recruitment';

const STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offered: 'Offered',
  hired: 'Hired',
  rejected: 'Rejected',
};

export default function ApplicationList() {
  const [searchParams] = useSearchParams();
  const vacancyId = searchParams.get('vacancyId');

  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getApplications({
        vacancyId: vacancyId || undefined,
        status: statusFilter || undefined,
      });
      setApplications(data.applications);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [vacancyId, statusFilter]);

  const statusBadge = (status) => {
    const styles = {
      applied: 'bg-slate-100 text-slate-600',
      shortlisted: 'bg-blue-50 text-blue-700',
      interview_scheduled: 'bg-purple-50 text-purple-700',
      interviewed: 'bg-indigo-50 text-indigo-700',
      offered: 'bg-yellow-50 text-yellow-700',
      hired: 'bg-green-50 text-green-700',
      rejected: 'bg-red-50 text-red-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Applications{vacancyId ? ' (filtered by vacancy)' : ''}
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 font-medium">Applied</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No applications found.
                </td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {a.candidateName}
                    <div className="text-xs text-slate-400">{a.candidateEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.vacancy?.title}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(a.status)}>{STATUS_LABELS[a.status]}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/recruitment/applications/${a._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      View
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