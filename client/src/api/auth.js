import api from './axios';

export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const logoutUser = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  api.put(`/auth/reset-password/${token}`, { password });