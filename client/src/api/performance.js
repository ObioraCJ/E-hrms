import api from './axios';

export const createReview = (reviewData) => api.post('/performance', reviewData);

export const getReviews = (params = {}) => api.get('/performance', { params });

export const getReviewById = (id) => api.get(`/performance/${id}`);

export const updateReview = (id, updates) => api.put(`/performance/${id}`, updates);

export const getMyReviews = () => api.get('/performance/my');

export const getMyReviewById = (id) => api.get(`/performance/my/${id}`);

export const acknowledgeReview = (id) => api.put(`/performance/${id}/acknowledge`);