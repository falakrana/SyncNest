import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.access_token);
      const user = await authService.getMe();
      set({ user, token: data.access_token, loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Login failed', loading: false });
      return false;
    }
  },

  signup: async (name, email, password) => {
    try {
      set({ loading: true, error: null });
      await authService.signup(name, email, password);
      set({ loading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Signup failed', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      set({ loading: true });
      const user = await authService.getMe();
      set({ user, loading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },
}));

export default useAuthStore;
