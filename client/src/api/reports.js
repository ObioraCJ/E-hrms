import api from './axios';

// responseType: 'blob' tells axios to receive raw binary data (a
// Blob object) instead of trying to parse the response as JSON -
// essential for downloading files like Excel/PDF, which aren't
// JSON-shaped at all.
export const downloadReport = (type, params = {}) =>
  api.get(`/reports/${type}`, { params, responseType: 'blob' });