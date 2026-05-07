import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token));
  failedQueue = [];
};

api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && !original.url.includes('/auth/refresh-token')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then(token => { original.headers.Authorization = `Bearer ${token}`; return api(original); });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await api.post('/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally { isRefreshing = false; }
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
};

export const profileAPI = {
  get: () => api.get('/profile'),
  save: (data) => api.post('/profile', data),
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
};

export default api;
