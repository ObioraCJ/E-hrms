import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getEmployees, deleteEmployee } from '../api/employees';
import { useAuth } from '../context/AuthContext';

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canDelete = user?.role === 'super_admin';

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await getEmployees({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchEmployees(1);
  }, [fetchEmployees]);

  const handleTerminate = async (id, name) => {
    if (!window.confirm(`Terminate ${name}? This revokes their login access.`)) return;
    try {
      await deleteEmployee(id);
      fetchEmployees(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to terminate employee');
    }
  };

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-green-50 text-green-700',
      'on-leave': 'bg-yellow-50 text-yellow-700',
      terminated: 'bg-red-50 text-red-700',
    };
    return `rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || 'bg-slate-50 text-slate-700'}`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Employees</h1>
        <Link
          to="/employees/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Employee
        </Link>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on-leave">On leave</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Employee ID</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Designation</th>
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp._id}>
                  <td className="px-4 py-3 font-mono text-slate-600">{emp.employeeId}</td>
                  <td className="px-4 py-3 text-slate-900">
                    {emp.user?.firstName} {emp.user?.lastName}
                    <div className="text-xs text-slate-400">{emp.user?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                  <td className="px-4 py-3 text-slate-600">{emp.designation}</td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(emp.status)}>{emp.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/employees/${emp._id}/edit`}
                      className="mr-3 text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Edit
                    </Link>
                    {canDelete && emp.status !== 'terminated' && (
                      <button
                        onClick={() =>
                          handleTerminate(emp._id, `${emp.user?.firstName} ${emp.user?.lastName}`)
                        }
                        className="text-red-600 hover:text-red-700 hover:underline"
                      >
                        Terminate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchEmployees(pagination.page - 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchEmployees(pagination.page + 1)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}