import type { ISettingsRepository } from '@/database/repositories/interfaces';
import { useThemeStore, type ThemePreference } from '@/stores/theme.store';
import { secureStorage, StorageKeys } from '@/utils/storage';
import { logger } from '@/utils/logger';

export interface NotificationPreferences {
  budgetAlerts: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  syncNotifications: boolean;
}

/**
 * SettingsService provides application-level configuration wrappers,
 * coordinating theme, currency, and local device preferences.
 */
export class SettingsService {
  constructor(private settingsRepo: ISettingsRepository) {}

  public async getSetting(key: string): Promise<string | null> {
    return this.settingsRepo.get(key);
  }

  public async setSetting(key: string, value: string): Promise<void> {
    return this.settingsRepo.set(key, value);
  }

  /**
   * Theme Management.
   */
  public async getTheme(): Promise<ThemePreference> {
    const value = await this.getSetting('theme_preference');
    return (value as ThemePreference) || 'system';
  }

  public async setTheme(theme: ThemePreference): Promise<void> {
    logger.info(`SettingsService: Changing theme preference to ${theme}`);
    
    // Save to local database (triggers sync outbox)
    await this.setSetting('theme_preference', theme);
    
    // Save to secure storage for boot persistence
    await secureStorage.set(StorageKeys.THEME_PREFERENCE, theme);
    
    // Update global state store instantly
    useThemeStore.getState().setPreference(theme);
  }

  /**
   * Currency Management.
   */
  public async getCurrency(): Promise<string> {
    const value = await this.getSetting('currency_preference');
    return value || 'INR';
  }

  public async setCurrency(currency: string): Promise<void> {
    logger.info(`SettingsService: Changing currency preference to ${currency}`);
    
    await this.setSetting('currency_preference', currency);
    await secureStorage.set(StorageKeys.LAST_SELECTED_CURRENCY, currency);
  }

  /**
   * Notification Preferences.
   */
  public async getNotificationPreferences(): Promise<NotificationPreferences> {
    const [budget, daily, weekly, monthly, sync] = await Promise.all([
      this.getSetting('notify_budget_alerts'),
      this.getSetting('notify_daily_reminder'),
      this.getSetting('notify_weekly_summary'),
      this.getSetting('notify_monthly_summary'),
      this.getSetting('notify_sync_notifications'),
    ]);

    return {
      budgetAlerts: budget !== 'false', // default true
      dailyReminder: daily !== 'false', // default true
      weeklySummary: weekly === 'true', // default false
      monthlySummary: monthly === 'true', // default false
      syncNotifications: sync !== 'false', // default true
    };
  }

  public async setNotificationPreference(key: keyof NotificationPreferences, enabled: boolean): Promise<void> {
    const dbKey = this.mapNotificationKey(key);
    await this.setSetting(dbKey, String(enabled));
  }

  private mapNotificationKey(key: keyof NotificationPreferences): string {
    const map = {
      budgetAlerts: 'notify_budget_alerts',
      dailyReminder: 'notify_daily_reminder',
      weeklySummary: 'notify_weekly_summary',
      monthlySummary: 'notify_monthly_summary',
      syncNotifications: 'notify_sync_notifications',
    };
    return map[key];
  }
}
