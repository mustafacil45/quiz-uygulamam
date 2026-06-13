import api from './api';
import Cookies from 'js-cookie';

export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);

  const response = await api.post('/auth/admin/token', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  if (response.data.access_token) {
    Cookies.set('admin_token', response.data.access_token, { expires: 1 });
  }
  return response.data;
};

export const logout = () => {
  Cookies.remove('admin_token');
  window.location.href = '/admin/login';
};
