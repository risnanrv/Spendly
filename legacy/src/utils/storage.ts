import * as SecureStore from 'expo-secure-store';
import { logger } from './logger';

// ─── Secure Storage Helpers ───────────────────────────────────────────────
// All auth tokens and sensitive data MUST use these helpers.
// Never use AsyncStorage for sensitive information.

export const StorageKeys = {
  ACCESS_TOKEN: 'spendly_access_token',
  REFRESH_TOKEN: 'spendly_refresh_token',
  USER_ID: 'spendly_user_id',
  USER_SESSION: 'spendly_user_session',
  THEME_PREFERENCE: 'spendly_theme_preference',
  LAST_SELECTED_CURRENCY: 'spendly_currency',
  LAST_SYNCS_TIMESTAMP: 'spendly_last_sync_timestamp',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export const secureStorage = {
  async get(key: StorageKey): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      logger.error(`SecureStorage.get failed for key: ${key}`, error);
      return null;
    }
  },

  async set(key: StorageKey, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      logger.error(`SecureStorage.set failed for key: ${key}`, error);
    }
  },

  async remove(key: StorageKey): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logger.error(`SecureStorage.remove failed for key: ${key}`, error);
    }
  },

  async clearAll(): Promise<void> {
    const keys = Object.values(StorageKeys) as StorageKey[];
    await Promise.all(keys.map((key) => secureStorage.remove(key)));
  },
};
