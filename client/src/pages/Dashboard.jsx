import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary, getDashboardCharts } from '../api/dashboard';

const PIE_COLORS = ['#2563eb', '#f59e0b', '#ef4444', '#94a3b8'];
const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', cancelled: 'Cancelled' };

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          getDashboardSummary(),
          getDashboardCharts(),
        ]);
        setSummary(summaryRes.data);
        setCharts(chartsRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const canViewPayroll = user?.role === 'super_admin' || user?.role === 'hr_manager';

  const cards = summary
    ? [
        { label: 'Total Employees', value: summary.totalEmployees, color: 'text-blue-600' },
        { label: 'Active Employees', value: summary.activeEmployees, color: 'text-green-600' },
        { label: 'On Leave', value: summary.onLeaveEmployees, color: 'text-yellow-600' },
        { label: 'Departments', value: summary.totalDepartments, color: 'text-blue-600' },
        { label: "Today's Attendance", value: summary.todaysAttendanceCount, color: 'text-indigo-600' },
        { label: 'Pending Leave Requests', value: summary.pendingLeaveRequests, color: 'text-orange-600' },
        { label: 'New Hires (this month)', value: summary.newHiresThisMonth, color: 'text-blue-600' },
        ...(canViewPayroll
          ? [
              {
                label: 'Monthly Payroll',
                value: `$${Number(summary.monthlyPayrollTotal).toLocaleString()}`,
                color: 'text-green-700',
              },
            ]
          : []),
      ]
    : [];

  // Formats the raw "date" strings (e.g. "2024-03-15") into short
  // weekday labels (e.g. "Fri") for the attendance trend chart's x-axis
  // - much more scannable than a full date on a small chart.
  const attendanceChartData = charts?.attendanceTrend.map((d) => ({
    day: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }),
    count: d.count,
  }));

  const leaveChartData = charts?.leaveStats.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
  }));

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
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className={`mt-2 text-2xl font-semibold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Attendance trend - last 7 days */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Attendance Trend (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Department distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">
                Department Distribution
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={charts?.departmentDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Leave statistics */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Leave Statistics</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={leaveChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {leaveChartData?.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}