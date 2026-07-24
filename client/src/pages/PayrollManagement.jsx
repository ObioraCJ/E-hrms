import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generatePayroll, getPayrolls, updatePayrollStatus } from '../api/payroll';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PayrollManagement() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getPayrolls({ month, year });
      setPayrolls(data.payrolls);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [month, year]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      const { data } = await generatePayroll(month, year);
      setMessage(
        `Generated ${data.generated} new record(s). ${data.alreadyExisted} already existed. ${data.skippedNoSalary} skipped (no salary set).`
      );
      fetchPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    const label = nextStatus === 'finalized' ? 'finalize' : 'mark as paid';
    if (!window.confirm(`Are you sure you want to ${label} this payroll record?`)) return;
    try {
      await updatePayrollStatus(id, nextStatus);
      fetchPayrolls();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${label}`);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      draft: 'bg-slate-100 text-slate-600',
      finalized: 'bg-blue-50 text-blue-700',
      paid: 'bg-green-50 text-green-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  const formatCurrency = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Payroll</h1>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Payroll'}
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Gross Pay</th>
              <th className="px-4 py-3 font-medium">Deductions</th>
              <th className="px-4 py-3 font-medium">Net Pay</th>
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
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No payroll records for this period yet. Click "Generate Payroll" to create them.
                </td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {p.employee?.user?.firstName} {p.employee?.user?.lastName}
                    <div className="text-xs text-slate-400">{p.employee?.employeeId}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(p.grossPay)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(p.totalDeductions)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(p.netPay)}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(p.status)}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      {p.status === 'draft' && (
                        <>
                          <Link to={`/payroll/${p._id}/edit`} className="text-blue-600 hover:underline">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleStatusChange(p._id, 'finalized')}
                            className="text-slate-600 hover:underline"
                          >
                            Finalize
                          </button>
                        </>
                      )}
                      {p.status === 'finalized' && (
                        <button
                          onClick={() => handleStatusChange(p._id, 'paid')}
                          className="text-green-600 hover:underline"
                        >
                          Mark as Paid
                        </button>
                      )}
                      {p.status === 'paid' && <span className="text-xs text-slate-400">—</span>}
                    </div>
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