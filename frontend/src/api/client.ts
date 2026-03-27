import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — silent refresh on 401, role sync on 403
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

let isRefreshingRole = false;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    // ── 401: try silent refresh ──────────────────────────────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the failed request until refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(Promise.reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refreshToken },
        );
        const newAccessToken: string = res.data.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 403: role may have been changed by an admin ──────────────────────────
    if (error.response?.status === 403 && !isRefreshingRole) {
      const { accessToken, user } = useAuthStore.getState();
      if (accessToken && user) {
        isRefreshingRole = true;
        try {
          const res = await apiClient.get('/users/me');
          const freshRole = res.data?.data?.role;
          if (freshRole && freshRole !== user.role) {
            useAuthStore.getState().syncRole(freshRole);
            if (freshRole === 'USER' && window.location.pathname.startsWith('/admin')) {
              window.location.href = '/';
            } else if (freshRole === 'ADMIN' && !window.location.pathname.startsWith('/admin')) {
              window.location.href = '/admin';
            }
          }
        } catch {
          // session invalid, ignore
        } finally {
          isRefreshingRole = false;
        }
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
