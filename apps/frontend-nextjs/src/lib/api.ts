import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken') ?? (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = res.data.data;

        Cookies.set('accessToken', accessToken, { expires: 1 / 96 }); // 15 min
        Cookies.set('refreshToken', newRefresh, { expires: 7 });
        localStorage.setItem('accessToken', accessToken);

        failedQueue.forEach(p => p.resolve(accessToken));
        failedQueue = [];

        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        failedQueue.forEach(p => p.reject(error));
        failedQueue = [];
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error?.response?.data ?? error);
  },
);

export default api;
