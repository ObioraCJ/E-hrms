import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">E-HRMS Dashboard</h1>
        <button onClick={logout} >
          Log out
        </button>
        <p className="text-gray-700">
          Welcome, <span className="font-medium">{user?.firstName} {user?.lastName}</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">Role: {user?.role}</p>
      </header>
      }
