import axios, { type AxiosRequestConfig } from 'axios';
import { Config } from '@/config/env';
import { logger } from '@/utils/logger';
import { secureStorage, StorageKeys } from '@/utils/storage';
import { useAuthStore } from '@/stores/auth.store';

// ─── Axios Instance ───────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: Config.api.baseUrl,
  timeout: Config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Queue for Refreshing ────────────────────────────────────────
interface FailedRequest {
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ─────────────────────────────────────────────────
// Attaches the Bearer token to every request automatically
apiClient.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.get(StorageKeys.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    logger.debug(`→ ${config.method?.toUpperCase()} ${config.url ?? ''}`);
    return config;
  },
  (error: unknown) => {
    logger.error('Request interceptor error', error);
    return Promise.reject(error);
  },
);

// ─── Response Interceptor ────────────────────────────────────────────────
// Normalizes errors and handles 401 token expiry with automatic refresh
apiClient.interceptors.response.use(
  (response) => {
    logger.debug(`← ${response.status} ${response.config.url ?? ''}`);
    return response;
  },
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      logger.error('Unknown API error', error);
      return Promise.reject(new ApiError('Unknown error occurred', 0));
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status ?? 0;
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message;

    logger.error(`API error ${status}: ${message}`);

    // If 401 and not already retried
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/token')) {
        // If refresh token request itself fails with 401, force logout
        await handleForceLogout();
        return Promise.reject(new ApiError('Session expired. Please log in again.', 401));
      }

      if (isRefreshing) {
        // Queue this request and wait for token refresh to complete
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.get(StorageKeys.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        logger.info('Access token expired. Requesting session token refresh...');

        // Perform token refresh call using a clean non-intercepted axios instance
        const refreshResponse = await axios.post<{ token: string }>(
          `${Config.api.baseUrl}/auth/token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data.token;
        logger.info('Session refreshed successfully.');

        // Update tokens in storage and store
        await secureStorage.set(StorageKeys.ACCESS_TOKEN, newAccessToken);
        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Replay original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        logger.error('Session token refresh failed. Forcing logout.', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        await handleForceLogout();
        return Promise.reject(new ApiError('Session expired. Please log in again.', 401));
      }
    }

    return Promise.reject(new ApiError(message, status));
  },
);

const handleForceLogout = async () => {
  useAuthStore.getState().clearAuth();
  await secureStorage.clearAll();
  logger.info('Local session cleared.');
};

// ─── ApiError ────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.statusCode === 0;
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}
