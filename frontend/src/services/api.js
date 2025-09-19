import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
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
export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
};

// Events API
export const eventsAPI = {
  getEvents: (params) => api.get('/events', { params }),
  getEvent: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  getMyEvents: (params) => api.get('/events/my/created', { params }),
};

// RSVP API
export const rsvpAPI = {
  createRSVP: (eventId, rsvpData) => api.post(`/rsvps/events/${eventId}`, rsvpData),
  getUserRSVPs: (params) => api.get('/rsvps/my', { params }),
  getUserEventRSVP: (eventId) => api.get(`/rsvps/events/${eventId}`),
  getEventRSVPs: (eventId, params) => api.get(`/rsvps/events/${eventId}/all`, { params }),
  deleteRSVP: (eventId) => api.delete(`/rsvps/events/${eventId}`),
};

// Comments API
export const commentsAPI = {
  getEventComments: (eventId, params) => api.get(`/comments/events/${eventId}`, { params }),
  createComment: (eventId, commentData) => api.post(`/comments/events/${eventId}`, commentData),
  updateComment: (commentId, commentData) => api.put(`/comments/${commentId}`, commentData),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),
  getUserComments: (params) => api.get('/comments/my', { params }),
};

// Users API
export const usersAPI = {
  getProfile: (userId) => userId ? api.get(`/users/${userId}`) : api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  changePassword: (passwordData) => api.put('/users/password', passwordData),
  updateEmail: (emailData) => api.put('/users/email', emailData),
  deleteAccount: (data) => api.delete('/users/account', { data }),
  getDashboard: () => api.get('/users/dashboard'),
  searchUsers: (params) => api.get('/users/search', { params }),
};

// Admin API
export const adminAPI = {
  login: (credentials) => api.post('/admin/api/login', credentials),
  getDashboardStats: () => api.get('/admin/api/dashboard/stats'),
  getRecentActivity: (params) => api.get('/admin/api/dashboard/activity', { params }),
  getAllUsers: (params) => api.get('/admin/api/users', { params }),
  getAllEvents: (params) => api.get('/admin/api/events', { params }),
  deleteUser: (userId) => api.delete(`/admin/api/users/${userId}`),
  deleteEvent: (eventId) => api.delete(`/admin/api/events/${eventId}`),
  toggleUserStatus: (userId) => api.patch(`/admin/api/users/${userId}/status`),
};

export default api;