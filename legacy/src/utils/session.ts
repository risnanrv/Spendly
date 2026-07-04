import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/stores/auth.store';
import { secureStorage, StorageKeys } from '@/utils/storage';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/utils/logger';

/**
 * SessionManager monitors AppState foreground/background changes
 * and enforces token validations and auto-refreshes.
 */
class SessionManager {
  private activeStateListener: any = null;
  private isCheckingSession = false;

  public start() {
    if (this.activeStateListener) return;

    logger.info('SessionManager started listener.');
    this.activeStateListener = AppState.addEventListener(
      'change',
      this.handleAppStateChange
    );
  }

  public stop() {
    if (this.activeStateListener) {
      this.activeStateListener.remove();
      this.activeStateListener = null;
      logger.info('SessionManager stopped listener.');
    }
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      logger.debug('App transitioned to foreground. Checking session...');
      await this.validateAndRefreshSession();
    }
  };

  /**
   * Proactively verifies session credentials when the app is active.
   */
  public async validateAndRefreshSession() {
    if (this.isCheckingSession) return;
    this.isCheckingSession = true;

    try {
      const accessToken = await secureStorage.get(StorageKeys.ACCESS_TOKEN);
      const { isAuthenticated, clearAuth } = useAuthStore.getState();

      if (!accessToken && isAuthenticated) {
        // State mismatch: local store says authenticated but no access token
        logger.warn('Token missing while store is authenticated. Clearing auth.');
        clearAuth();
        await secureStorage.clearAll();
        return;
      }

      if (accessToken) {
        // Send a verification ping to Hono.
        // If expired, the Axios interceptor auto-refreshes or logs out the user
        await apiClient.get('/auth/get-session');
      }
    } catch (error) {
      logger.error('Session validation check error:', error);
    } finally {
      this.isCheckingSession = false;
    }
  }
}

export const sessionManager = new SessionManager();
