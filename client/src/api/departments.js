import api from './axios';

export const getDepartments = () => api.get('/departments');

export const getDepartmentById = (id) => api.get(`/departments/${id}`);

export const createDepartment = (departmentData) => api.post('/departments', departmentData);

export const updateDepartment = (id, updates) => api.put(`/departments/${id}`, updates);

export const deleteDepartment = (id) => api.delete(`/departments/${id}`);