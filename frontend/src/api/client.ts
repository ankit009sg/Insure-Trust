import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Helper: send a log entry to the backend log receiver ───────────────────
// Uses a plain fetch (not apiClient) to avoid infinite recursion in interceptors.
function sendLog(entry: {
  level: 'info' | 'warn' | 'error';
  method?: string;
  url: string;
  status?: number;
  duration_ms?: number;
  message?: string;
  error?: string;
  user_email?: string;
}) {
  const userEmail = useAuthStore.getState().email ?? undefined;
  const payload = { ...entry, user_email: entry.user_email ?? userEmail };

  // Fire-and-forget — never await, never throw
  fetch(`${API_URL}/api/v1/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // keepalive lets the browser dispatch the request even during page unload
    keepalive: true,
  }).catch(() => {
    // Silently ignore if log endpoint is unreachable
  });
}

// ─── Request Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Attach auth token
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Tag start time on the config so we can compute duration in the response
    (config as any)._startTime = performance.now();

    sendLog({
      level: 'info',
      method: config.method?.toUpperCase(),
      url: `${config.baseURL ?? ''}${config.url ?? ''}`,
      message: 'Request sent',
    });

    return config;
  },
  (error) => {
    sendLog({
      level: 'error',
      url: error.config?.url ?? 'unknown',
      message: 'Request setup error',
      error: String(error.message),
    });
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ───────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    const duration_ms = performance.now() - ((response.config as any)._startTime ?? performance.now());

    sendLog({
      level: 'info',
      method: response.config.method?.toUpperCase(),
      url: `${response.config.baseURL ?? ''}${response.config.url ?? ''}`,
      status: response.status,
      duration_ms,
      message: 'Response received',
    });

    return response;
  },
  (error) => {
    // Auto-logout on 401
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().logout();
    }

    const duration_ms = error.config?._startTime
      ? performance.now() - error.config._startTime
      : undefined;

    sendLog({
      level: error.response?.status >= 500 ? 'error' : 'warn',
      method: error.config?.method?.toUpperCase(),
      url: `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`,
      status: error.response?.status,
      duration_ms,
      message: error.response?.data?.detail ?? 'Request failed',
      error: String(error.message),
    });

    return Promise.reject(error);
  }
);
