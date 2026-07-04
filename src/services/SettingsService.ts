import type { ISettingsRepository } from '@/database/repositories/interfaces';
import { useThemeStore, type ThemePreference } from '@/stores/theme.store';
import { logger } from '@/utils/logger';

export interface NotificationPreferences {
  budgetAlerts: boolean;
  dailyReminder: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  syncNotifications: boolean;
}

export class SettingsService {
  constructor(private settingsRepo: ISettingsRepository) {}

  public async getSetting(userId: string, key: string): Promise<string | null> {
    return this.settingsRepo.get(userId, key);
  }

  public async setSetting(userId: string, key: string, value: string): Promise<void> {
    return this.settingsRepo.set(userId, key, value);
  }

  public async getTheme(userId: string): Promise<ThemePreference> {
    const value = await this.getSetting(userId, 'theme_preference');
    return (value as ThemePreference) || 'system';
  }

  public async setTheme(userId: string, theme: ThemePreference): Promise<void> {
    logger.info(`SettingsService: Changing theme preference to ${theme} for user ${userId}`);
    await this.setSetting(userId, 'theme_preference', theme);
    
    // Update global theme store state
    if (typeof window !== 'undefined') {
      useThemeStore.getState().setPreference(theme);
    }
  }

  public async getCurrency(userId: string): Promise<string> {
    const value = await this.getSetting(userId, 'currency_preference');
    return value || 'INR';
  }

  public async setCurrency(userId: string, currency: string): Promise<void> {
    logger.info(`SettingsService: Changing currency preference to ${currency} for user ${userId}`);
    await this.setSetting(userId, 'currency_preference', currency);
  }

  public async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const [budget, daily, weekly, monthly, sync] = await Promise.all([
      this.getSetting(userId, 'notify_budget_alerts'),
      this.getSetting(userId, 'notify_daily_reminder'),
      this.getSetting(userId, 'notify_weekly_summary'),
      this.getSetting(userId, 'notify_monthly_summary'),
      this.getSetting(userId, 'notify_sync_notifications'),
    ]);

    return {
      budgetAlerts: budget !== 'false',
      dailyReminder: daily !== 'false',
      weeklySummary: weekly === 'true',
      monthlySummary: monthly === 'true',
      syncNotifications: sync !== 'false',
    };
  }

  public async setNotificationPreference(userId: string, key: keyof NotificationPreferences, enabled: boolean): Promise<void> {
    const dbKey = this.mapNotificationKey(key);
    await this.setSetting(userId, dbKey, String(enabled));
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
