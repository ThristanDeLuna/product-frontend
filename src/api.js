import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

export const storage = {
  get access() { return localStorage.getItem('access_token'); },
  get refresh() { return localStorage.getItem('refresh_token'); },
  get user() {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  },
  save(tokens, user) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  },
  clear() {
    ['access_token', 'refresh_token', 'user'].forEach((k) => localStorage.removeItem(k));
  },
};

const api = axios.create({ baseURL: BASE_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (storage.access) config.headers.Authorization = `Bearer ${storage.access}`;
  return config;
});

// On 401, try the refresh token once, then replay the original request.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/api/auth/');
    if (error.response?.status === 401 && !original._retry && !isAuthCall && storage.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${BASE_URL}/api/auth/refresh`, { refresh_token: storage.refresh });
        const { data } = await refreshing;
        storage.save(data.tokens);
        refreshing = null;
        original.headers.Authorization = `Bearer ${data.tokens.access_token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        storage.clear();
        window.dispatchEvent(new Event('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (e) =>
  e.response?.data?.error || (e.request ? 'Cannot reach the server. Is the API running?' : e.message);

export const login = (username, password) => api.post('/api/auth/login', { username, password }).then((r) => r.data);
export const register = (username, email, password) =>
  api.post('/api/auth/register', { username, email, password }).then((r) => r.data);
export const logout = () =>
  api.post('/api/auth/logout', { refresh_token: storage.refresh }).catch(() => {});

export const listProducts = () => api.get('/api/products').then((r) => r.data.data);
export const createProduct = (p) => api.post('/api/products', p).then((r) => r.data.data);
export const updateProduct = (id, p) => api.put(`/api/products/${id}`, p).then((r) => r.data.data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`).then((r) => r.data);
