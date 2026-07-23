import api from './axios';

export const getAttendance = (params = {}) => api.get('/attendance', { params });

export const getMyAttendance = (params = {}) => api.get('/attendance/my', { params });

export const createAttendance = (attendanceData) => api.post('/attendance', attendanceData);

export const updateAttendance = (id, updates) => api.put(`/attendance/${id}`, updates);

export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);