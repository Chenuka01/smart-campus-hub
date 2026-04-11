import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8084/api';
export const API_BASE_URL = API_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/google/verify');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  // Real OAuth 2.0: sends Google ID token to backend for server-side verification
  googleVerify: (credential: string) =>
    api.post('/auth/google/verify', { credential }),
  // Legacy: sends pre-parsed user info (kept for compatibility)
  googleAuth: (data: { email: string; name: string; avatarUrl: string; providerId: string }) =>
    api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name: string; email: string }) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
  updateUserRoles: (userId: string, roles: string[]) =>
    api.put(`/auth/users/${userId}/roles`, { roles }),
  deleteUser: (userId: string) => api.delete(`/auth/users/${userId}`),
  // Password Reset APIs
  requestPasswordReset: (email: string) =>
    api.post('/auth/password-reset/request', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/auth/password-reset/verify-otp', { email, otp }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/password-reset/reset', { email, otp, newPassword }),
};

// Facilities API
export const facilityApi = {
  getAll: () => api.get('/facilities'),
  getById: (id: string) => api.get(`/facilities/${id}`),
  search: (params: Record<string, string>) =>
    api.get('/facilities/search', { params }),
  create: (data: Record<string, unknown>) => api.post('/facilities', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/facilities/${id}`, data),
  delete: (id: string) => api.delete(`/facilities/${id}`),
};

// Bookings API
export const bookingApi = {
  create: (data: Record<string, unknown>) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getAll: (status?: string) =>
    api.get('/bookings', { params: status ? { status } : {} }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByFacility: (facilityId: string) => api.get(`/bookings/facility/${facilityId}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/bookings/${id}`, data),
  approve: (id: string) => api.put(`/bookings/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/bookings/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) =>
    api.put(`/bookings/${id}/cancel`, { reason }),
};

// Tickets API
export const ticketApi = {
  create: (data: Record<string, unknown>) => api.post('/tickets/simple', data),
  createWithFiles: (formData: FormData) => api.post('/tickets', formData),
  getMy: () => api.get('/tickets/my'),
  getAssigned: () => api.get('/tickets/assigned'),
  getAll: (status?: string) =>
    api.get('/tickets', { params: status ? { status } : {} }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/tickets/${id}`, data),
  updateWithFiles: (id: string, formData: FormData) => api.put(`/tickets/${id}/with-files`, formData),
  updateWithFilesLegacy: (id: string, formData: FormData) => api.put(`/tickets/${id}`, formData),
  assign: (id: string, technicianId: string, technicianName: string) =>
    api.put(`/tickets/${id}/assign`, { technicianId, technicianName }),
  updateStatus: (id: string, status: string, resolutionNotes?: string, rejectionReason?: string) =>
    api.put(`/tickets/${id}/status`, { status, resolutionNotes, rejectionReason }),
  delete: (id: string) => api.delete(`/tickets/${id}`),
  bulkDelete: (ids: string[]) => api.delete('/tickets/bulk-delete', { data: ids }),
  clearHistory: () => api.delete('/tickets/clear-history'),
};

// Comments API
export const commentApi = {
  getByTicket: (ticketId: string) => api.get(`/comments/ticket/${ticketId}`),
  create: (ticketId: string, content: string) =>
    api.post(`/comments/ticket/${ticketId}`, { content }),
  update: (commentId: string, content: string) =>
    api.put(`/comments/${commentId}`, { content }),
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Notifications API
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  getCount: () => api.get('/notifications/count'),
  getAnalytics: () => api.get('/notifications/analytics'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: {
    email: boolean;
    dndMode: boolean;
    dndStart: string;
    dndEnd: string;
    bookingAlerts: boolean;
    ticketUpdates: boolean;
    comments: boolean;
  }) => api.put('/notifications/preferences', data),
};

export default api;
