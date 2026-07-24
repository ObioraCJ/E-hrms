import api from './axios';

export const applyLeave = (leaveData) => api.post('/leaves', leaveData);

export const cancelLeave = (id) => api.put(`/leaves/${id}/cancel`);

export const getMyLeaves = () => api.get('/leaves/my');

export const getMyBalance = () => api.get('/leaves/my/balance');

export const getAllLeaves = (params = {}) => api.get('/leaves', { params });

export const reviewLeave = (id, reviewData) => api.put(`/leaves/${id}/review`, reviewData);