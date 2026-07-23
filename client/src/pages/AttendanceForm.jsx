import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createAttendance, updateAttendance, getAttendance } from '../api/attendance';
import { getEmployees } from '../api/employees';

export default function AttendanceForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [employee, setEmployee] = useState('');
  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('0');
  const [status, setStatus] = useState('present');
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadEmployeeOptions = async () => {
      try {
        const { data } = await getEmployees({ limit: 500 });
        setEmployeeOptions(data.employees);
      } catch {
        // Non-fatal, same reasoning as DepartmentForm.
      }
    };
    loadEmployeeOptions();
  }, []);

  // datetime-local inputs need "YYYY-MM-DDTHH:mm" format specifically -
  // this converts a full ISO timestamp from the API into that shape.
  const toDateTimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    if (!isEditMode) return;

    const loadRecord = async () => {
      try {
        // There's no dedicated getById for attendance yet, so we fetch
        // via the list endpoint filtered by nothing and find this one -
        // acceptable for now given the small dataset; a getAttendanceById
        // route would be a cleaner follow-up if this list grows large.
        const { data } = await getAttendance();
        const record = data.attendance.find((r) => r._id === id);
        if (!record) {
          setError('Attendance record not found');
          return;
        }
        setEmployee(record.employee?._id || '');
        setDate(record.date ? record.date.slice(0, 10) : '');
        setClockIn(toDateTimeLocal(record.clockIn));
        setClockOut(toDateTimeLocal(record.clockOut));
        setBreakMinutes(String(record.breakMinutes ?? 0));
        setStatus(record.status || 'present');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance record');
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        clockIn: clockIn || undefined,
        clockOut: clockOut || null,
        breakMinutes: Number(breakMinutes) || 0,
        status,
      };

      if (isEditMode) {
        await updateAttendance(id, payload);
      } else {
        await createAttendance({ ...payload, employee, date });
      }
      navigate('/attendance');
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

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">
        {isEditMode ? 'Edit Attendance Record' : 'Add Attendance Record'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        {!isEditMode && (
          <>
            <div>
              <label htmlFor="employee" className="mb-1 block text-sm font-medium text-slate-700">
                Employee
              </label>
              <select
                id="employee"
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select an employee...</option>
                {employeeOptions.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="clockIn" className="mb-1 block text-sm font-medium text-slate-700">
              Clock In
            </label>
            <input
              id="clockIn"
              type="datetime-local"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="clockOut" className="mb-1 block text-sm font-medium text-slate-700">
              Clock Out
            </label>
            <input
              id="clockOut"
              type="datetime-local"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="breakMinutes" className="mb-1 block text-sm font-medium text-slate-700">
              Break (minutes)
            </label>
            <input
              id="breakMinutes"
              type="number"
              min="0"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="half-day">Half-day</option>
              <option value="absent">Absent</option>
            </select>
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Record'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}