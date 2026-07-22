import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDepartments, deleteDepartment } from '../api/departments';
import { useAuth } from '../context/AuthContext';

export default function DepartmentList() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canManage = user?.role === 'super_admin' || user?.role === 'hr_manager';
  const canDelete = user?.role === 'super_admin';

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getDepartments();
      setDepartments(data.departments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteDepartment(id);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Departments</h1>
        {canManage && (
          <Link
            to="/departments/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Department
          </Link>
        )}
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : departments.length === 0 ? (
        <p className="text-slate-400">No departments found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-slate-900">{dept.name}</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {dept.employeeCount} {dept.employeeCount === 1 ? 'employee' : 'employees'}
                </span>
              </div>

              {dept.description && (
                <p className="mt-2 text-sm text-slate-600">{dept.description}</p>
              )}

              <p className="mt-3 text-xs text-slate-400">
                Manager:{' '}
                {dept.manager?.user
                  ? `${dept.manager.user.firstName} ${dept.manager.user.lastName}`
                  : 'Unassigned'}
              </p>

              {canManage && (
                <div className="mt-4 flex gap-3 border-t border-slate-100 pt-3 text-sm">
                  <Link
                    to={`/departments/${dept._id}/edit`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Edit
                  </Link>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(dept._id, dept.name)}
                      className="text-red-600 hover:text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}