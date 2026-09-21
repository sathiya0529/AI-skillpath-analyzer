import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillpath_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !location.pathname.startsWith('/login')) {
      localStorage.removeItem('skillpath_token');
      // don't hard-redirect here; AuthContext handles it
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e, fallback = 'Something went wrong') =>
  e?.response?.data?.error || e?.message || fallback;

export default api;
