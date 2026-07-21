import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Welcome back, <span className="font-medium">{user?.firstName}</span>.
      </p>
    </div>
  );
}