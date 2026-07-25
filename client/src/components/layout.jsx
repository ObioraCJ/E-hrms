import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import logo from '../assets/Ehrm.png';

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manageMenuOpen, setManageMenuOpen] = useState(false);
  const manageMenuRef = useRef(null);

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

  // Links every logged-in user sees directly in the top-level nav.
  const primaryLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/my-leave', label: 'My Leave' },
    { to: '/my-payslips', label: 'My Payslips' },
  ];

  const canManageSettings = user?.role === 'super_admin';
  // Links that only show up for HR/admin/department-manager roles,
  // tucked into the "Manage" dropdown instead of the main row so the
  // top-level nav doesn't get overcrowded as more modules get added.
  const manageLinks = [
    { to: '/employees', label: 'Employees', show: canManageEmployees },
    { to: '/departments', label: 'Departments', show: canManageEmployees },
    { to: '/attendance', label: 'Attendance', show: canManageEmployees },
    { to: '/leave-management', label: 'Leave Management', show: canManageEmployees },
    { to: '/reports', label: 'Reports', show: canManageEmployees },
    { to: '/payroll', label: 'Payroll', show: canManagePayroll },
    { to: '/announcements', label: 'Announcements', show: canManagePayroll },
    { to: '/settings', label: 'Settings', show: canManageSettings },
  ].filter((link) => link.show);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Closes the "Manage" dropdown when clicking anywhere outside it -
  // same pattern used in NotificationBell.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (manageMenuRef.current && !manageMenuRef.current.contains(e.target)) {
        setManageMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Is the current page one of the "Manage" links? Used to highlight
  // the "Manage" button itself when you're on one of those pages.
  const isOnManagePage = manageLinks.some((link) => location.pathname.startsWith(link.to));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
              <img src={logo} alt="E-HRMS logo" className="h-10 w-auto sm:h-12" />
            </Link>

            {/* Desktop nav: hidden below md, shown at md+ */}
            <nav className="hidden items-center gap-1 md:flex">
              {primaryLinks.map((link) => (
                <Link key={link.to} to={link.to} className={navLinkClasses(link.to)}>
                  {link.label}
                </Link>
              ))}

              {manageLinks.length > 0 && (
                <div className="relative" ref={manageMenuRef}>
                  <button
                    onClick={() => setManageMenuOpen((prev) => !prev)}
                    className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition ${
                      isOnManagePage
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Menu
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${manageMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {manageMenuOpen && (
                    <div className="absolute left-0 z-10 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      {manageLinks.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          onClick={() => setManageMenuOpen(false)}
                          className={`block px-4 py-2 text-sm transition ${
                            location.pathname.startsWith(link.to)
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-600 lg:inline">
              {user?.firstName} {user?.lastName}
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {user?.role}
              </span>
            </span>

            <NotificationBell />

            <button
              onClick={logout}
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 sm:inline-block"
            >
              Log out
            </button>

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

        {/* Mobile dropdown menu: only below md */}
        {mobileMenuOpen && (
          <nav className="mt-3 flex flex-col gap-1 border-t border-slate-100 pt-3 md:hidden">
            {primaryLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={navLinkClasses(link.to)}
              >
                {link.label}
              </Link>
            ))}

            {manageLinks.length > 0 && (
              <>
                <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Manage
                </p>
                {manageLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={closeMobileMenu}
                    className={navLinkClasses(link.to)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

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