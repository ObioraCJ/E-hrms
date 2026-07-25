import api from './axios';

export const getMyNotifications = () => api.get('/notifications/my');

export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () => api.put('/notifications/read-all');

export const createAnnouncement = (data) => api.post('/notifications/announcement', data);