import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createDepartment, updateDepartment, getDepartmentById } from '../api/departments';
import { getEmployees } from '../api/employees';

export default function DepartmentForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [manager, setManager] = useState('');
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
        // Non-fatal: if this fails, the form still works, just without
        // a manager dropdown populated.
      }
    };
    loadEmployeeOptions();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadDepartment = async () => {
      try {
        const { data } = await getDepartmentById(id);
        const dept = data.department;
        setName(dept.name || '');
        setDescription(dept.description || '');
        setManager(dept.manager?._id || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load department');
      } finally {
        setLoading(false);
      }
    };

    loadDepartment();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        description,
        manager: manager || null,
      };

      if (isEditMode) {
        await updateDepartment(id, payload);
      } else {
        await createDepartment(payload);
      }
      navigate('/departments');
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
        {isEditMode ? 'Edit Department' : 'Add Department'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
            Department Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="e.g. Engineering"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            placeholder="What does this department do?"
          />
        </div>

        <div>
          <label htmlFor="manager" className="mb-1 block text-sm font-medium text-slate-700">
            Manager
          </label>
          <select
            id="manager"
            value={manager}
            onChange={(e) => setManager(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">Unassigned</option>
            {employeeOptions.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.user?.firstName} {emp.user?.lastName} ({emp.employeeId})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Department'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/departments')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}