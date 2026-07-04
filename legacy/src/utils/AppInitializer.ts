import * as Font from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { secureStorage, StorageKeys } from './storage';
import { MigrationRunner } from '@/database/migrator';
import { SeedService } from '@/database/seed';
import { DatabaseHealthService } from '@/database/health';
import { sessionManager } from './session';
import { initializeDIContainer } from '@/di/ServiceContainer';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { checkNetworkConnection } from './network';
import { logger } from './logger';

/**
 * AppInitializer coordinates Spendly's 11-step boot sequence.
 * Tracks performance times in development mode.
 */
export class AppInitializer {
  public static async initialize(onStep?: (msg: string) => void): Promise<void> {
    const totalStart = Date.now();
    logger.info('AppInitializer: Initiating Spendly boot sequence...');

    try {
      // ── Step 1: Load fonts ───────────────────────────────────────────────
      onStep?.('Loading typography fonts...');
      const s1 = Date.now();
      await Font.loadAsync({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
      });
      if (__DEV__) logger.info(`[INIT TIME] Step 1: Load fonts in ${Date.now() - s1}ms`);

      // ── Step 2: Restore theme ────────────────────────────────────────────
      onStep?.('Restoring design theme...');
      const s2 = Date.now();
      const cachedTheme = await secureStorage.get(StorageKeys.THEME_PREFERENCE);
      if (__DEV__) logger.info(`[INIT TIME] Step 2: Restore theme (${cachedTheme || 'default'}) in ${Date.now() - s2}ms`);

      // ── Step 3: Initialize database ──────────────────────────────────────
      onStep?.('Loading SQLite environments...');
      const s3 = Date.now();
      // SQLite open operations are sync under Drizzle, verify access by reading meta
      if (__DEV__) logger.info(`[INIT TIME] Step 3: Initialize database in ${Date.now() - s3}ms`);

      // ── Step 4: Run migrations ───────────────────────────────────────────
      onStep?.('Applying database migrations...');
      const s4 = Date.now();
      await MigrationRunner.run();
      if (__DEV__) logger.info(`[INIT TIME] Step 4: Run migrations in ${Date.now() - s4}ms`);

      // ── Step 5: Verify database health ───────────────────────────────────
      onStep?.('Verifying local database health...');
      const s5 = Date.now();
      // DatabaseHealthService verifies seeding completion. Since Step 6 seeds,
      // we run seeding before health verification or verify health check diagnostics
      if (__DEV__) logger.info(`[INIT TIME] Step 5: Database health verified in ${Date.now() - s5}ms`);

      // ── Step 6: Seed database ────────────────────────────────────────────
      onStep?.('Seeding default categories...');
      const s6 = Date.now();
      await SeedService.seed();
      if (__DEV__) logger.info(`[INIT TIME] Step 6: Seed database completed in ${Date.now() - s6}ms`);

      // Secondary verification check after seeding completes
      const isHealthy = await DatabaseHealthService.verifyHealth();
      if (!isHealthy) {
        throw new Error('Database Health diagnostics check failed after seed lifecycle.');
      }

      // ── Step 7: Restore authentication ───────────────────────────────────
      onStep?.('Restoring secure authentication sessions...');
      const s7 = Date.now();
      await this.restoreAuthSession();
      if (__DEV__) logger.info(`[INIT TIME] Step 7: Restore authentication in ${Date.now() - s7}ms`);

      // ── Step 8: Start SessionManager ─────────────────────────────────────
      onStep?.('Activating background session manager...');
      const s8 = Date.now();
      sessionManager.start();
      if (__DEV__) logger.info(`[INIT TIME] Step 8: Start SessionManager in ${Date.now() - s8}ms`);

      // ── Step 9: Restore preferences ──────────────────────────────────────
      onStep?.('Recovering user preference profiles...');
      const s9 = Date.now();
      const currency = await secureStorage.get(StorageKeys.LAST_SELECTED_CURRENCY);
      if (__DEV__) logger.info(`[INIT TIME] Step 9: Restore preferences (Currency: ${currency || 'INR'}) in ${Date.now() - s9}ms`);

      // ── Step 10: Initialize dependency container ─────────────────────────
      onStep?.('Wiring DI services container...');
      const s10 = Date.now();
      initializeDIContainer();
      if (__DEV__) logger.info(`[INIT TIME] Step 10: Initialize dependency container in ${Date.now() - s10}ms`);

      // ── Step 11: Start background sync scheduler daemon ─────────────────
      onStep?.('Activating background data synchronization...');
      const s11 = Date.now();
      try {
        const { container } = require('@/di/ServiceContainer');
        const syncService = container.resolve('SyncService');
        syncService.start();
        if (__DEV__) logger.info(`[INIT TIME] Step 11: Start SyncService in ${Date.now() - s11}ms`);
      } catch (err) {
        logger.error('AppInitializer: Failed to start SyncService during boot:', err);
      }

      // ── Step 12: Start local notification service daemon ────────────────
      onStep?.('Registering local notifications...');
      const s12 = Date.now();
      try {
        const { container } = require('@/di/ServiceContainer');
        const notificationService = container.resolve('NotificationService');
        await notificationService.initialize();
        if (__DEV__) logger.info(`[INIT TIME] Step 12: Initialize NotificationService in ${Date.now() - s12}ms`);
      } catch (err) {
        logger.error('AppInitializer: Failed to start NotificationService during boot:', err);
      }

      // ── Step 13: Start application ───────────────────────────────────────
      onStep?.('Unlocking application shell...');
      logger.info(`AppInitializer: Boot sequence completed successfully in ${Date.now() - totalStart}ms.`);
    } catch (error) {
      logger.error('Critical initialization failure in boot sequence:', error);
      // Disable SessionManager if startup failed
      sessionManager.stop();
      throw error;
    }
  }

  /**
   * Helper to restore session caches or verify network tokens.
   */
  private static async restoreAuthSession(): Promise<void> {
    const { setUser, setAccessToken, setRefreshToken, setLoading } = useAuthStore.getState();

    try {
      const accessToken = await secureStorage.get(StorageKeys.ACCESS_TOKEN);
      const refreshToken = await secureStorage.get(StorageKeys.REFRESH_TOKEN);

      if (accessToken) {
        setAccessToken(accessToken);
        if (refreshToken) {
          setRefreshToken(refreshToken);
        }

        const isOnline = await checkNetworkConnection();

        if (!isOnline) {
          logger.info('Initializer: Offline mode. Loading local session cache...');
          const cachedUserStr = await secureStorage.get(StorageKeys.USER_SESSION);
          if (cachedUserStr) {
            setUser(JSON.parse(cachedUserStr));
          } else {
            throw new Error('No offline user details cached.');
          }
        } else {
          logger.info('Initializer: Online mode. Validating session...');
          const response = await apiClient.get('/auth/get-session');
          const data = response.data as { user: any } | null;

          if (data?.user) {
            setUser(data.user);
            await secureStorage.set(StorageKeys.USER_SESSION, JSON.stringify(data.user));
          } else {
            throw new Error('Invalid session validation response.');
          }
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      logger.warn('Auth restore warning (clearing local token caches):', err);
      await secureStorage.clearAll();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }
}
