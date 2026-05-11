import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve());
  failedQueue = [];
};

// ── REQUEST: Attach token from localStorage (fallback for cross-domain) ──────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── RESPONSE: Handle 401 → refresh → retry ────────────────────────────────
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    const isAuthEndpoint = original.url.includes('/auth/refresh-token') ||
                           original.url.includes('/auth/login') ||
                           original.url.includes('/auth/register');

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(() => {
            const token = localStorage.getItem('accessToken');
            if (token) original.headers.Authorization = `Bearer ${token}`;
            original._retry = true;
            return api(original);
          })
          .catch(e => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/refresh-token', { refreshToken });

        if (data.accessToken) {
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
        }

        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        // Only redirect if not already on a public page
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (err.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (err.code === 'ECONNABORTED' || !err.response) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  createInvite: (data) => api.post('/auth/invite', data),
  validateToken: (token) => api.get(`/auth/validate-token?token=${token}`),
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  save: (data) => api.post('/profile', data),
  submit: () => api.post('/profile/submit'),
};

export const educationAPI = {
  getAll: () => api.get('/education'),
  add: (data) => api.post('/education', data),
  update: (id, data) => api.put(`/education/${id}`, data),
  delete: (id) => api.delete(`/education/${id}`),
};

export const experienceAPI = {
  getAll: () => api.get('/experience'),
  add: (data) => api.post('/experience', data),
  update: (id, data) => api.put(`/experience/${id}`, data),
  delete: (id) => api.delete(`/experience/${id}`),
  uploadCertificate: (file) => {
    const form = new FormData();
    form.append('certificate', file);
    return api.post('/experience/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const documentAPI = {
  get: () => api.get('/documents'),
  upload: (fieldname, file) => {
    const form = new FormData();
    form.append(fieldname, file);
    return api.post(`/documents/upload/${fieldname}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetail: (id) => api.get(`/admin/user/${id}`),
  verifyUser: (id, data) => api.put(`/admin/verify/${id}`, data),
  compilePdf: (id) => api.post(`/admin/compile-pdf/${id}`),
  syncDrive: (id) => api.post(`/admin/sync-drive/${id}`),
  getActivityLogs: () => api.get('/admin/activity-logs'),
  downloadPdf: (id) => api.get(`/admin/download-pdf/${id}`, { responseType: 'blob' }),
  deleteUser: (id) => api.delete(`/admin/user/${id}`),
};

export default api;
