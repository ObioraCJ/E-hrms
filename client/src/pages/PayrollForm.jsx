import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPayrollById, updatePayroll } from '../api/payroll';

export default function PayrollForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payroll, setPayroll] = useState(null);
  const [allowances, setAllowances] = useState('0');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [overtimeRate, setOvertimeRate] = useState('0');
  const [bonuses, setBonuses] = useState('0');
  const [otherDeductions, setOtherDeductions] = useState('0');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPayroll = async () => {
      try {
        const { data } = await getPayrollById(id);
        setPayroll(data.payroll);
        setAllowances(String(data.payroll.allowances ?? 0));
        setOvertimeHours(String(data.payroll.overtimeHours ?? 0));
        setOvertimeRate(String(data.payroll.overtimeRate ?? 0));
        setBonuses(String(data.payroll.bonuses ?? 0));
        setOtherDeductions(String(data.payroll.otherDeductions ?? 0));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payroll record');
      } finally {
        setLoading(false);
      }
    };
    loadPayroll();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await updatePayroll(id, {
        allowances: Number(allowances) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        overtimeRate: Number(overtimeRate) || 0,
        bonuses: Number(bonuses) || 0,
        otherDeductions: Number(otherDeductions) || 0,
      });
      navigate('/payroll');
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading...</p>;
  }

  if (!payroll) {
    return <p className="text-red-600">{error || 'Payroll record not found'}</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Edit Payroll</h1>
      <p className="mb-6 text-sm text-slate-500">
        {payroll.employee?.user?.firstName} {payroll.employee?.user?.lastName} —{' '}
        Basic Salary: ${Number(payroll.basicSalary).toLocaleString()}
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="allowances" className="mb-1 block text-sm font-medium text-slate-700">
            Allowances
          </label>
          <input
            id="allowances"
            type="number"
            min="0"
            value={allowances}
            onChange={(e) => setAllowances(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="overtimeHours" className="mb-1 block text-sm font-medium text-slate-700">
              Overtime Hours
            </label>
            <input
              id="overtimeHours"
              type="number"
              min="0"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="overtimeRate" className="mb-1 block text-sm font-medium text-slate-700">
              Overtime Rate (per hour)
            </label>
            <input
              id="overtimeRate"
              type="number"
              min="0"
              value={overtimeRate}
              onChange={(e) => setOvertimeRate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bonuses" className="mb-1 block text-sm font-medium text-slate-700">
            Bonuses
          </label>
          <input
            id="bonuses"
            type="number"
            min="0"
            value={bonuses}
            onChange={(e) => setBonuses(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <div>
          <label htmlFor="otherDeductions" className="mb-1 block text-sm font-medium text-slate-700">
            Other Deductions
          </label>
          <input
            id="otherDeductions"
            type="number"
            min="0"
            value={otherDeductions}
            onChange={(e) => setOtherDeductions(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>

        <p className="text-xs text-slate-400">
          Tax and pension are calculated automatically based on gross pay and basic salary.
        </p>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/payroll')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}