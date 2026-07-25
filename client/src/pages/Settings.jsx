import { useState, useEffect } from 'react';
import {
  getSettings,
  updateSettings,
  addHoliday,
  deleteHoliday,
} from '../api/settings';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedSection, setSavedSection] = useState('');

  // Separate form state per section, so saving one section (e.g. Work
  // Schedule) doesn't require touching or re-submitting the others.
  const [companyName, setCompanyName] = useState('');
  const [workSchedule, setWorkSchedule] = useState({ startHour: 9, graceMinutes: 60, fullDayHours: 8 });
  const [payrollRates, setPayrollRates] = useState({ taxRate: 0.1, pensionRate: 0.08 });
  const [leaveAllocations, setLeaveAllocations] = useState({
    annual: 20, sick: 10, casual: 7, maternity: 90, paternity: 14,
  });

  const [holidayName, setHolidayName] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const [savingSection, setSavingSection] = useState(null);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getSettings();
      const s = data.settings;
      setSettings(s);
      setCompanyName(s.companyName || '');
      setWorkSchedule(s.workSchedule);
      setPayrollRates(s.payrollRates);
      setLeaveAllocations(s.leaveAllocations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Generic save handler for the three "flat form" sections. sectionKey
  // matches the field name on the Settings model (workSchedule,
  // payrollRates, leaveAllocations), and value is that section's
  // current form state - this one function handles all three instead
  // of writing three nearly-identical save handlers.
  const handleSaveSection = async (sectionKey, value, label) => {
    setSavingSection(sectionKey);
    setError('');
    setSavedSection('');
    try {
      const { data } = await updateSettings({ [sectionKey]: value });
      setSettings(data.settings);
      setSavedSection(label);
      setTimeout(() => setSavedSection(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to save ${label}`);
    } finally {
      setSavingSection(null);
    }
  };

  const handleSaveCompanyName = async () => {
    setSavingSection('companyName');
    setError('');
    try {
      const { data } = await updateSettings({ companyName });
      setSettings(data.settings);
      setSavedSection('Company info');
      setTimeout(() => setSavedSection(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company name');
    } finally {
      setSavingSection(null);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayName || !holidayDate) return;
    try {
      const { data } = await addHoliday({ name: holidayName, date: holidayDate });
      setSettings(data.settings);
      setHolidayName('');
      setHolidayDate('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm('Remove this holiday?')) return;
    try {
      const { data } = await deleteHoliday(holidayId);
      setSettings(data.settings);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove holiday');
    }
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (!settings) return <p className="text-red-600">{error || 'Failed to load settings'}</p>;

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600';
  const sectionClass = 'rounded-xl border border-slate-200 bg-white p-6';
  const saveBtnClass =
    'rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50';

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Settings</h1>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      {savedSection && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {savedSection} saved.
        </p>
      )}

      {/* Company Info */}
      <div className={sectionClass}>
        <h2 className="mb-4 font-semibold text-slate-900">Company Info</h2>
        <label className="mb-1 block text-sm font-medium text-slate-700">Company Name</label>
        <div className="flex gap-3">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={inputClass}
          />
          <button
            onClick={handleSaveCompanyName}
            disabled={savingSection === 'companyName'}
            className={saveBtnClass}
          >
            Save
          </button>
        </div>
      </div>

      {/* Work Schedule */}
      <div className={sectionClass}>
        <h2 className="mb-4 font-semibold text-slate-900">Work Schedule</h2>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start Hour (0-23)</label>
            <input
              type="number"
              min="0"
              max="23"
              value={workSchedule.startHour}
              onChange={(e) =>
                setWorkSchedule((prev) => ({ ...prev, startHour: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Grace (minutes)</label>
            <input
              type="number"
              min="0"
              value={workSchedule.graceMinutes}
              onChange={(e) =>
                setWorkSchedule((prev) => ({ ...prev, graceMinutes: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Day (hours)</label>
            <input
              type="number"
              min="1"
              value={workSchedule.fullDayHours}
              onChange={(e) =>
                setWorkSchedule((prev) => ({ ...prev, fullDayHours: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
        </div>
        <button
          onClick={() => handleSaveSection('workSchedule', workSchedule, 'Work schedule')}
          disabled={savingSection === 'workSchedule'}
          className={saveBtnClass}
        >
          {savingSection === 'workSchedule' ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Payroll Rates */}
      <div className={sectionClass}>
        <h2 className="mb-4 font-semibold text-slate-900">Payroll Rates</h2>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Tax Rate ({(payrollRates.taxRate * 100).toFixed(0)}%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={payrollRates.taxRate}
              onChange={(e) =>
                setPayrollRates((prev) => ({ ...prev, taxRate: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Pension Rate ({(payrollRates.pensionRate * 100).toFixed(0)}%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={payrollRates.pensionRate}
              onChange={(e) =>
                setPayrollRates((prev) => ({ ...prev, pensionRate: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Enter as a decimal (e.g. 0.1 = 10%). Applies to future payroll generation only — already
          generated records are unaffected.
        </p>
        <button
          onClick={() => handleSaveSection('payrollRates', payrollRates, 'Payroll rates')}
          disabled={savingSection === 'payrollRates'}
          className={saveBtnClass}
        >
          {savingSection === 'payrollRates' ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Leave Allocations */}
      <div className={sectionClass}>
        <h2 className="mb-4 font-semibold text-slate-900">Annual Leave Allocations (days)</h2>
        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Object.keys(leaveAllocations).map((type) => (
            <div key={type}>
              <label className="mb-1 block text-sm font-medium capitalize text-slate-700">
                {type}
              </label>
              <input
                type="number"
                min="0"
                value={leaveAllocations[type]}
                onChange={(e) =>
                  setLeaveAllocations((prev) => ({ ...prev, [type]: Number(e.target.value) }))
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => handleSaveSection('leaveAllocations', leaveAllocations, 'Leave allocations')}
          disabled={savingSection === 'leaveAllocations'}
          className={saveBtnClass}
        >
          {savingSection === 'leaveAllocations' ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Holidays */}
      <div className={sectionClass}>
        <h2 className="mb-4 font-semibold text-slate-900">Public Holidays</h2>

        <form onSubmit={handleAddHoliday} className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              placeholder="e.g. New Year's Day"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <button type="submit" className={saveBtnClass}>
            Add
          </button>
        </form>

        {settings.holidays.length === 0 ? (
          <p className="text-sm text-slate-400">No holidays added yet.</p>
        ) : (
          <div className="space-y-2">
            {settings.holidays.map((h) => (
              <div
                key={h._id}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
              >
                <span className="text-slate-900">
                  {h.name}{' '}
                  <span className="text-slate-400">
                    — {new Date(h.date).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </span>
                <button
                  onClick={() => handleDeleteHoliday(h._id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}