import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVacancies, updateVacancy } from '../api/recruitment';

export default function VacancyList() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVacancies = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getVacancies();
      setVacancies(data.vacancies);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vacancies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  const handleToggleStatus = async (vacancy) => {
    const nextStatus = vacancy.status === 'open' ? 'closed' : 'open';
    try {
      await updateVacancy(vacancy._id, { status: nextStatus });
      fetchVacancies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update vacancy');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Job Vacancies</h1>
        <Link
          to="/recruitment/vacancies/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New Vacancy
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Applications</th>
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
            ) : vacancies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No vacancies yet.
                </td>
              </tr>
            ) : (
              vacancies.map((v) => (
                <tr key={v._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{v.title}</td>
                  <td className="px-4 py-3 text-slate-600">{v.department}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <Link
                      to={`/recruitment/applications?vacancyId=${v._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {v.applicationCount}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleStatus(v)}
                      className="text-blue-600 hover:underline"
                    >
                      {v.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
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