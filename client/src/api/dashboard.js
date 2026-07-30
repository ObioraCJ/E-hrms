import api from './axios';

export const getDashboardSummary = () => api.get('/dashboard/summary');

export const getDashboardCharts = () => api.get('/dashboard/charts');