import axios from 'axios';
import Cookies from 'js-cookie';

// Since we serve admin panel from the SAME origin (FastAPI), we can use relative path
const api = axios.create({
  // For local dev with separate backend, we need absolute URL
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Token ekle
api.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: 401 hatasında logout yap
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('admin_token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login'; // Updated path for subpath deployment
      }
    }
    return Promise.reject(error);
  }
);

export default api;
