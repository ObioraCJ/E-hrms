import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Ehrm.png';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const canManageEmployees =
    user?.role === 'super_admin' ||
    user?.role === 'hr_manager' ||
    user?.role === 'department_manager';

  const navLinkClasses = (path) =>
    `px-3 py-2 text-sm font-medium rounded-md transition ${
      location.pathname.startsWith(path)
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="E-HRMS logo" className="h-12 w-auto" />
            </Link>
            <nav className="flex gap-1">
              <Link to="/dashboard" className={navLinkClasses('/dashboard')}>
                Dashboard
              </Link>
              {canManageEmployees && (
                <>
                  <Link to="/employees" className={navLinkClasses('/employees')}>
                    Employees
                  </Link>
                  <Link to="/departments" className={navLinkClasses('/departments')}>
                    Departments
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {user?.role}
              </span>
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}