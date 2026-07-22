import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createEmployee, updateEmployee, getEmployeeById } from '../api/employees';

const initialFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'employee',
  department: '',
  designation: '',
  dateOfJoining: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  address: '',
  employmentType: 'full-time',
  status: 'active',
  salary: '',
};

export default function EmployeeForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditMode) return;

    const loadEmployee = async () => {
      try {
        const { data } = await getEmployeeById(id);
        const emp = data.employee;
        setForm({
          firstName: emp.user?.firstName || '',
          lastName: emp.user?.lastName || '',
          email: emp.user?.email || '',
          password: '',
          role: emp.user?.role || 'employee',
          department: emp.department || '',
          designation: emp.designation || '',
          dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '',
          dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.slice(0, 10) : '',
          gender: emp.gender || '',
          phone: emp.phone || '',
          address: emp.address || '',
          employmentType: emp.employmentType || 'full-time',
          status: emp.status || 'active',
          salary: emp.salary ?? '',
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    };

    loadEmployee();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isEditMode) {
        const { department, designation, dateOfJoining, dateOfBirth, gender, phone, address, employmentType, status, salary } = form;
        await updateEmployee(id, {
          department,
          designation,
          dateOfJoining,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          phone,
          address,
          employmentType,
          status,
          salary: salary === '' ? undefined : Number(salary),
        });
      } else {
        await createEmployee({
          ...form,
          salary: form.salary === '' ? undefined : Number(form.salary),
        });
      }
      navigate('/employees');
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
    <div className="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">
        {isEditMode ? 'Edit Employee' : 'Add Employee'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        {!isEditMode && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} required />
              <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
            <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
            <Field
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Min. 8 characters"
            />
            <SelectField
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              options={['employee', 'department_manager', 'hr_manager', 'super_admin']}
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Department" name="department" value={form.department} onChange={handleChange} required />
          <Field label="Designation" name="designation" value={form.designation} onChange={handleChange} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Date of Joining"
            name="dateOfJoining"
            type="date"
            value={form.dateOfJoining}
            onChange={handleChange}
            required
          />
          <Field
            label="Date of Birth"
            name="dateOfBirth"
            type="date"
            value={form.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={['', 'male', 'female', 'other']}
          />
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        </div>

        <Field label="Address" name="address" value={form.address} onChange={handleChange} />

        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Employment Type"
            name="employmentType"
            value={form.employmentType}
            onChange={handleChange}
            options={['full-time', 'part-time', 'contract', 'intern']}
          />
          {isEditMode && (
            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={['active', 'on-leave', 'terminated']}
            />
          )}
        </div>

        <Field label="Salary" name="salary" type="number" value={form.salary} onChange={handleChange} />

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Employee'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, name, type = 'text', value, onChange, required, placeholder }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === '' ? 'Select...' : opt}
          </option>
        ))}
      </select>
    </div>
  );
}