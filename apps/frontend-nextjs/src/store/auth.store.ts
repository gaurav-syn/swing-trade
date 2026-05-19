import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  initialCapital?: number;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data: any = await api.post('/auth/login', { email, password });
          Cookies.set('accessToken', data.accessToken, { expires: 1 / 96 });
          Cookies.set('refreshToken', data.refreshToken, { expires: 7 });
          localStorage.setItem('accessToken', data.accessToken);
          set({ user: data.user, accessToken: data.accessToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res: any = await api.post('/auth/register', data);
          Cookies.set('accessToken', res.accessToken, { expires: 1 / 96 });
          Cookies.set('refreshToken', res.refreshToken, { expires: 7 });
          localStorage.setItem('accessToken', res.accessToken);
          set({ user: res.user, accessToken: res.accessToken, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        try {
          const refreshToken = Cookies.get('refreshToken');
          await api.post('/auth/logout', { refreshToken });
        } catch {}
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      loadUser: async () => {
        const token = Cookies.get('accessToken') ?? localStorage.getItem('accessToken');
        if (!token) return;
        try {
          const user: any = await api.get('/auth/me');
          set({ user, isAuthenticated: true, accessToken: token });
        } catch {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
