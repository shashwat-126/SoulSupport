import axios from 'axios';
import { clearAuthToken, getAuthToken } from '@/lib/authToken';
import { normalizeApiError } from '@/lib/apiError';

const isClient = typeof window !== 'undefined';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    if (isClient) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && isClient) {
      clearAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(normalizeApiError(error));
  }
);

export default api;
