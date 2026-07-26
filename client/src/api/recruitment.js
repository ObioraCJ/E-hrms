import api from './axios';

// ---- Public (no auth needed, though our axios instance will still
// attach a token if one happens to exist in localStorage - harmless,
// since these backend routes don't check for one at all) ----
export const getPublicVacancies = () => api.get('/recruitment/public/vacancies');

export const getPublicVacancyById = (id) => api.get(`/recruitment/public/vacancies/${id}`);

// formData must be a browser FormData object (built in the component),
// since this request includes a file upload, not plain JSON.
export const submitApplication = (vacancyId, formData) =>
  api.post(`/recruitment/public/vacancies/${vacancyId}/apply`, formData);

// ---- Admin (HR/super_admin only) ----
export const createVacancy = (data) => api.post('/recruitment/vacancies', data);

export const getVacancies = (params = {}) => api.get('/recruitment/vacancies', { params });

export const updateVacancy = (id, data) => api.put(`/recruitment/vacancies/${id}`, data);

export const getApplications = (params = {}) => api.get('/recruitment/applications', { params });

export const getApplicationById = (id) => api.get(`/recruitment/applications/${id}`);

export const downloadResume = (id) =>
  api.get(`/recruitment/applications/${id}/resume`, { responseType: 'blob' });

export const updateApplicationStatus = (id, data) =>
  api.put(`/recruitment/applications/${id}/status`, data);

export const scheduleInterview = (id, data) =>
  api.post(`/recruitment/applications/${id}/interviews`, data);

export const sendOffer = (id, data) => api.post(`/recruitment/applications/${id}/offer`, data);