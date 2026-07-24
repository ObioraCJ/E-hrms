import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/Ehrm.png';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const canManageEmployees =
    user?.role === 'super_admin' ||
    user?.role === 'hr_manager' ||
    user?.role === 'department_manager';

  const canManagePayroll = user?.role === 'super_admin' || user?.role === 'hr_manager';

  const navLinkClasses = (path) =>
    `px-3 py-2 text-sm font-medium rounded-md transition ${
      location.pathname.startsWith(path)
        ? 'bg-blue-600 text-white'
        : 'text-slate-600 hover:bg-slate-100'
    }`;

  // Shared list of nav links, since both the desktop row and the mobile
  // dropdown need the exact same set - building it once as data avoids
  // maintaining two separate, easily-out-of-sync copies of this markup.
  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', show: true },
    { to: '/my-leave', label: 'My Leave', show: true },
    { to: '/my-payslips', label: 'My Payslips', show: true },
    { to: '/employees', label: 'Employees', show: canManageEmployees },
    { to: '/departments', label: 'Departments', show: canManageEmployees },
    { to: '/attendance', label: 'Attendance', show: canManageEmployees },
    { to: '/leave-management', label: 'Leave Management', show: canManageEmployees },
    { to: '/payroll', label: 'Payroll', show: canManagePayroll },
  ];

  // closeMobileMenu is passed to every link's onClick so tapping any
  // link on mobile also collapses the menu, instead of leaving it open
  // and covering the page after navigating.
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src={logo} alt="E-HRMS logo" className="h-10 w-auto sm:h-12" />
            </Link>

            {/* Desktop nav: hidden below the md breakpoint, shown at md+ */}
            <nav className="hidden md:flex md:gap-1">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <Link key={link.to} to={link.to} className={navLinkClasses(link.to)}>
                    {link.label}
                  </Link>
                ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* User info + logout: hidden on the smallest screens to
                save space, shown from sm breakpoint up */}
            <span className="hidden text-sm text-slate-600 sm:inline">
              {user?.firstName} {user?.lastName}
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {user?.role}
              </span>
            </span>
            <button
              onClick={logout}
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:inline-block"
            >
              Log out
            </button>

            {/* Hamburger button: only visible below md breakpoint */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu: only rendered when open, only visible below md */}
        {mobileMenuOpen && (
          <nav className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 md:hidden">
            {navLinks
              .filter((link) => link.show)
              .map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMobileMenu}
                  className={navLinkClasses(link.to)}
                >
                  {link.label}
                </Link>
              ))}
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
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
          </nav>
        )}
      </header>

      <main className="p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
}