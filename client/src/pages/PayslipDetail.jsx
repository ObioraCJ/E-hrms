import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMyPayslipById } from '../api/payroll';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function PayslipDetail() {
  const { id } = useParams();
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMyPayslipById(id);
        setPayroll(data.payroll);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payslip');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const formatCurrency = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (error || !payroll) {
    return <p className="text-red-600">{error || 'Payslip not found'}</p>;
  }

  const overtimePay = payroll.overtimeHours * payroll.overtimeRate;

  return (
    <div className="max-w-xl">
      <Link to="/my-payslips" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← Back to payslips
      </Link>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {MONTH_NAMES[payroll.month - 1]} {payroll.year} Payslip
            </h1>
            <p className="text-sm text-slate-500">
              {payroll.employee?.user?.firstName} {payroll.employee?.user?.lastName} ·{' '}
              {payroll.employee?.employeeId}
            </p>
            <p className="text-xs text-slate-400">{payroll.employee?.designation}</p>
          </div>
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium capitalize text-green-700">
            {payroll.status}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Basic Salary</span>
            <span className="text-slate-900">{formatCurrency(payroll.basicSalary)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Allowances</span>
            <span className="text-slate-900">{formatCurrency(payroll.allowances)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">
              Overtime ({payroll.overtimeHours}h × {formatCurrency(payroll.overtimeRate)})
            </span>
            <span className="text-slate-900">{formatCurrency(overtimePay)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bonuses</span>
            <span className="text-slate-900">{formatCurrency(payroll.bonuses)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
            <span className="text-slate-700">Gross Pay</span>
            <span className="text-slate-900">{formatCurrency(payroll.grossPay)}</span>
          </div>

          <div className="mt-4 flex justify-between">
            <span className="text-slate-500">Tax</span>
            <span className="text-red-600">-{formatCurrency(payroll.tax)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pension</span>
            <span className="text-red-600">-{formatCurrency(payroll.pension)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Other Deductions</span>
            <span className="text-red-600">-{formatCurrency(payroll.otherDeductions)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-2 font-medium">
            <span className="text-slate-700">Total Deductions</span>
            <span className="text-red-600">-{formatCurrency(payroll.totalDeductions)}</span>
          </div>

          <div className="mt-4 flex justify-between rounded-lg bg-blue-50 p-3 text-base font-semibold">
            <span className="text-slate-900">Net Pay</span>
            <span className="text-blue-700">{formatCurrency(payroll.netPay)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}