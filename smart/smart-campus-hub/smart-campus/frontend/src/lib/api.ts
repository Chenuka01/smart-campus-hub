import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  googleAuth: (data: { email: string; name: string; avatarUrl: string; providerId: string }) =>
    api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
  getUsers: () => api.get('/auth/users'),
  updateUserRoles: (userId: string, roles: string[]) =>
    api.put(`/auth/users/${userId}/roles`, { roles }),
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
  approve: (id: string) => api.put(`/bookings/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.put(`/bookings/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) =>
    api.put(`/bookings/${id}/cancel`, { reason }),
};

// Tickets API
export const ticketApi = {
  create: (data: Record<string, unknown>) => api.post('/tickets/simple', data),
  createWithFiles: (formData: FormData) =>
    api.post('/tickets', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getMy: () => api.get('/tickets/my'),
  getAssigned: () => api.get('/tickets/assigned'),
  getAll: (status?: string) =>
    api.get('/tickets', { params: status ? { status } : {} }),
  getById: (id: string) => api.get(`/tickets/${id}`),
  assign: (id: string, technicianId: string, technicianName: string) =>
    api.put(`/tickets/${id}/assign`, { technicianId, technicianName }),
  updateStatus: (id: string, status: string, resolutionNotes?: string, rejectionReason?: string) =>
    api.put(`/tickets/${id}/status`, { status, resolutionNotes, rejectionReason }),
  delete: (id: string) => api.delete(`/tickets/${id}`),
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
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
