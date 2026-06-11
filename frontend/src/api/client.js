// api/client.js
// All HTTP calls to the backend go through this instance.
// Handles: base URL, Authorization header injection, 401→refresh token rotation.

import axios from 'axios';
import { useAuthStore } from '../store/auth.store.js';

function resolveApiBaseUrl() {
  const explicit = import.meta.env.VITE_API_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  return '/api';
}

export const API_BASE_URL = resolveApiBaseUrl();

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends httpOnly cookie for refresh token
});

export function getWebhookBaseUrl() {
  const explicit = import.meta.env.VITE_WEBHOOK_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  try {
    const resolved = new URL(API_BASE_URL, window.location.origin);
    return resolved.origin;
  } catch {
    return window.location.origin;
  }
}

// Attach access token to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401s and attempt silent token refresh
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue concurrent requests while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const { accessToken } = res.data;

        useAuthStore.getState().setAccessToken(accessToken);
        processQueue(null, accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
