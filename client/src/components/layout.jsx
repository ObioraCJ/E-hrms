import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from "../assets/Ehrm.png";

export default function Layout() {
  const { user, logout } = useAuth();
   const location = useLocation();

     const canManageEmployees = user?.role === 'admin' || user?.role === 'hr_manager';

     const navLinkClasses = (path) =>
  `px-3 py-2 text-sm font-medium rounded-md transition ${
    location.pathname.startsWith(path)
      ? 'bg-blue-900 text-white'
      : 'text-gray-600 hover:bg-gray-100'
  }`;

   return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-blue-900">
            <img src={logo} alt="E-HRMS logo" className="h-10 w-auto" />
            </span>
            <nav className="flex gap-1">
              <Link to="/dashboard" className={navLinkClasses('/dashboard')}>
                Dashboard
              </Link>
              {canManageEmployees && (
                <Link to="/employees" className={navLinkClasses('/employees')}>
                  Employees
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.firstName} {user?.lastName}
              <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-gray-800">
                {user?.role}
              </span>
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
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