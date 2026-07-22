import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../api/dashboard';

export default function Dashboard() {
  const { user } = useAuth();
   const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const { data } = await getDashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, []);

   const cards = summary
    ? [
        { label: 'Total Employees', value: summary.totalEmployees, color: 'text-blue-600' },
        { label: 'Active Employees', value: summary.activeEmployees, color: 'text-green-600' },
        { label: 'On Leave', value: summary.onLeaveEmployees, color: 'text-yellow-600' },
        { label: 'Departments', value: summary.totalDepartments, color: 'text-blue-600' },
        { label: 'New Hires (this month)', value: summary.newHiresThisMonth, color: 'text-blue-600' },
      ]
    : [];

 return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-slate-600">
        Welcome back, <span className="font-medium">{user?.firstName}</span>.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-slate-400">Loading summary...</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}