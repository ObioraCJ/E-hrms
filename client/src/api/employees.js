import api from './axios';

// Fetches a paginated, optionally filtered list of employees.
// params can include: { page, limit, department, status, search }
export const getEmployees = (params = {}) => api.get('/employees', { params });

export const getEmployeeById = (id) => api.get(`/employees/${id}`);

export const createEmployee = (employeeData) => api.post('/employees', employeeData);

export const updateEmployee = (id, updates) => api.put(`/employees/${id}`, updates);

export const deleteEmployee = (id) => api.delete(`/employees/${id}`);