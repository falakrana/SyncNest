import api from './api';

export const authService = {
  async signup(name, email, password) {
    const response = await api.post('/api/auth/signup', { name, email, password });
    return response.data;
  },

  async login(email, password) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getMe() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};
