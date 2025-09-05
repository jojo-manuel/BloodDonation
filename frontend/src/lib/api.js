// lib/api.js
// Axios instance with Authorization header and token refresh logic.

import axios from 'axios';

// Create a pre-configured axios client
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Attach Authorization header from localStorage for every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

function onRefreshed(token) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

// Auto-refresh access token on 401 and retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const refreshToken = localStorage.getItem('refreshToken');
          const { data } = await axios.post((import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') + '/auth/refresh', { refreshToken });
          const newAccess = data?.data?.accessToken;
          const newRefresh = data?.data?.refreshToken;
          if (newAccess) localStorage.setItem('accessToken', newAccess);
          if (newRefresh) localStorage.setItem('refreshToken', newRefresh);
          isRefreshing = false;
          onRefreshed(newAccess);
        } else {
          // If a refresh is already in progress, queue the request until it's done
          return new Promise((resolve) => {
            queue.push((token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            });
          });
        }
        // Retry with updated token
        original.headers.Authorization = `Bearer ${localStorage.getItem('accessToken')}`;
        return api(original);
      } catch (e) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

export default api;



