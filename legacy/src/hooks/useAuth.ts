import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore, type AuthUser } from '@/stores/auth.store';
import { secureStorage, StorageKeys } from '@/utils/storage';
import type { LoginInput, RegisterInput, ForgotPasswordInput } from '@/utils/validation';
import { checkNetworkConnection } from '@/utils/network';
import { logger } from '@/utils/logger';

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

/**
 * Hook to handle email/password login using Better Auth.
 */
export const useLogin = () => {
  const { setUser, setAccessToken, setRefreshToken, setError } = useAuthStore();

  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: async (data) => {
      const isOnline = await checkNetworkConnection();
      if (!isOnline) {
        throw new Error('Network unavailable. Please check your internet connection to log in.');
      }
      const response = await apiClient.post<AuthResponse>('/auth/sign-in/email', data);
      return response.data;
    },
    onSuccess: async (data) => {
      logger.info(`User logged in: ${data.user.email}`);
      
      // Store in secure storage
      await secureStorage.set(StorageKeys.ACCESS_TOKEN, data.token);
      if (data.refreshToken) {
        await secureStorage.set(StorageKeys.REFRESH_TOKEN, data.refreshToken);
      }
      await secureStorage.set(StorageKeys.USER_SESSION, JSON.stringify(data.user));
      
      // Update state
      setAccessToken(data.token);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      setUser(data.user);
      setError(null);
    },
    onError: (error: any) => {
      const errMsg = error.message || 'Login failed';
      logger.error('Login error', error);
      setError(errMsg);
    },
  });
};

/**
 * Hook to handle user registration.
 */
export const useRegister = () => {
  const { setUser, setAccessToken, setRefreshToken, setError } = useAuthStore();

  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: async (data) => {
      const isOnline = await checkNetworkConnection();
      if (!isOnline) {
        throw new Error('Network unavailable. Please check your internet connection to sign up.');
      }
      const response = await apiClient.post<AuthResponse>('/auth/sign-up/email', data);
      return response.data;
    },
    onSuccess: async (data) => {
      logger.info(`User registered: ${data.user.email}`);

      await secureStorage.set(StorageKeys.ACCESS_TOKEN, data.token);
      if (data.refreshToken) {
        await secureStorage.set(StorageKeys.REFRESH_TOKEN, data.refreshToken);
      }
      await secureStorage.set(StorageKeys.USER_SESSION, JSON.stringify(data.user));

      setAccessToken(data.token);
      if (data.refreshToken) {
        setRefreshToken(data.refreshToken);
      }
      setUser(data.user);
      setError(null);
    },
    onError: (error: any) => {
      const errMsg = error.message || 'Registration failed';
      logger.error('Registration error', error);
      setError(errMsg);
    },
  });
};

/**
 * Hook to handle user logout.
 */
export const useLogout = () => {
  const { clearAuth } = useAuthStore();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiClient.post('/auth/sign-out');
    },
    onSettled: async () => {
      logger.info('User logged out');
      // Always clear local session even if api request fails
      await secureStorage.clearAll();
      clearAuth();
    },
  });
};

/**
 * Hook to initiate forgot password email flow.
 */
export const useForgotPassword = () => {
  return useMutation<void, Error, ForgotPasswordInput>({
    mutationFn: async (data) => {
      await apiClient.post('/auth/forget-password', {
        email: data.email,
        redirectTo: 'spendly://reset-password',
      });
    },
    onSuccess: () => {
      logger.info('Password reset instructions sent');
    },
    onError: (error) => {
      logger.error('Forgot password error', error);
    },
  });
};

/**
 * Hook to reset password.
 */
export const useResetPassword = () => {
  return useMutation<void, Error, { password: string; token: string }>({
    mutationFn: async (data) => {
      await apiClient.post('/auth/reset-password', {
        newPassword: data.password,
        token: data.token,
      });
    },
    onSuccess: () => {
      logger.info('Password has been reset successfully');
    },
    onError: (error) => {
      logger.error('Reset password error', error);
    },
  });
};
