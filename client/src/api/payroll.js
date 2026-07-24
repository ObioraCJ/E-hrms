import api from './axios';

export const generatePayroll = (month, year) => api.post('/payroll/generate', { month, year });

export const getPayrolls = (params = {}) => api.get('/payroll', { params });

export const getPayrollById = (id) => api.get(`/payroll/${id}`);

export const updatePayroll = (id, updates) => api.put(`/payroll/${id}`, updates);

export const updatePayrollStatus = (id, status) => api.put(`/payroll/${id}/status`, { status });

export const getMyPayslips = () => api.get('/payroll/my');

export const getMyPayslipById = (id) => api.get(`/payroll/my/${id}`);