import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyPayslips } from '../api/payroll';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function MyPayslips() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyPayslips();
        setPayslips(data.payrolls);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payslips');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">My Payslips</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : payslips.length === 0 ? (
        <p className="text-slate-400">No payslips available yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Gross Pay</th>
                <th className="px-4 py-3 font-medium">Net Pay</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((p) => (
                <tr key={p._id}>
                  <td className="px-4 py-3 text-slate-900">
                    {MONTH_NAMES[p.month - 1]} {p.year}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(p.grossPay)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(p.netPay)}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/my-payslips/${p._id}`} className="text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}