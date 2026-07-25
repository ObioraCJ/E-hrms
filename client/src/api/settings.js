import api from './axios';

export const getSettings = () => api.get('/settings');

export const updateSettings = (updates) => api.put('/settings', updates);

export const addHoliday = (holiday) => api.post('/settings/holidays', holiday);

export const deleteHoliday = (holidayId) => api.delete(`/settings/holidays/${holidayId}`);