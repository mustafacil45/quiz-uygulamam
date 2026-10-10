import axios from 'axios';
import Cookies from 'js-cookie';

// Panel, backend ile aynı sunucudan "/admin" altında yayınlanır; bu yüzden
// production build'de API aynı origin'den ("/api") çağrılır, CORS gerekmez.
// Geliştirmede yerel backend'e gider. NEXT_PUBLIC_API_URL ile ezilebilir.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://127.0.0.1:8000/api');

const api = axios.create({
  baseURL: API_BASE,
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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
