import axios from 'axios';

// Since vite.config.js proxies /api to http://localhost:5000, we can use
// a relative baseURL here. In production you'd point this at your real
// API domain via an environment variable instead.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends the httpOnly refresh-token cookie automatically
});
 
// ---- Request interceptor ----
// Attaches the access token (stored in memory/localStorage) to every
// outgoing request, so we don't have to manually add it in every call.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
 
// ---- Response interceptor ----
// If a request fails with 401 (expired access token), try to silently
// refresh it once using the refresh token cookie, then retry the
// original request. If refresh also fails, the user is logged out.
let isRefreshing = false;
let pendingQueue = [];
 
const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  pendingQueue = [];
};
 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
 
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh is already in progress, queue this request
        // until it resolves, instead of firing multiple refresh calls.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
 
      originalRequest._retry = true;
      isRefreshing = true;
 
      try {
        const { data } = await api.post('/auth/refresh');
        localStorage.setItem('accessToken', data.accessToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
 
    return Promise.reject(error);
  }
);
 
export default api;
 
  