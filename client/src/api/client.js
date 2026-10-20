import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach token and active organization ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentOrg = localStorage.getItem('saas_current_org');
    if (currentOrg) {
      try {
        const org = JSON.parse(currentOrg);
        if (org && org.id) {
          config.headers['X-Organization-Id'] = org.id;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error message extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear auth data
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('saas_token');
        localStorage.removeItem('saas_current_org');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
