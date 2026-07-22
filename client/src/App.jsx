import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/EmployeeList';
import EmployeeForm from './pages/EmployeeForm';
import DepartmentList from './pages/DepartmentList';
import DepartmentForm from './pages/DepartmentForm';


function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            <Route element={<ProtectedRoute allowedRoles={['super_admin', 'hr_manager', 'department_manager']} />}>
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/new" element={<EmployeeForm />} />
              <Route path="/employees/:id/edit" element={<EmployeeForm />} />
              <Route path="/departments" element={<DepartmentList />} />
              <Route path="/departments/new" element={<DepartmentForm />} />
              <Route path="/departments/:id/edit" element={<DepartmentForm />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;