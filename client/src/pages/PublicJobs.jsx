import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicVacancies } from '../api/recruitment';
import logo from '../assets/Ehrm.png';

export default function PublicJobs() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPublicVacancies();
        setVacancies(data.vacancies);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load job openings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <img src={logo} alt="E-HRMS logo" className="h-10" />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Open Positions</h1>
        <p className="mb-8 text-slate-500">Join our team — browse current openings below.</p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : vacancies.length === 0 ? (
          <p className="text-slate-400">No open positions right now. Check back soon.</p>
        ) : (
          <div className="space-y-4">
            {vacancies.map((v) => (
              <Link
                key={v._id}
                to={`/careers/${v._id}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">{v.title}</h2>
                    <p className="text-sm text-slate-500">{v.department}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium capitalize text-blue-700">
                    {v.employmentType}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{v.description}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}