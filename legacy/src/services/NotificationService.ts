import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import { getMonthStr } from '@/utils/date';
import { logger } from '@/utils/logger';
import type { SettingsService } from './SettingsService';

// Configure how notifications display when app is open (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

/**
 * NotificationService manages scheduling and triggering local device notifications
 * using expo-notifications, handling daily reminders, weekly/monthly summaries,
 * and budget limit threshold breaches.
 */
export class NotificationService {
  private isInitialized = false;

  constructor(private settingsService: SettingsService) {}

  /**
   * Request user permission for push alerts and wire lifecycle listeners.
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    logger.info('NotificationService: Initializing system...');

    if (Platform.OS === 'web') {
      logger.warn('NotificationService: Push alerts are not supported on web environments.');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('NotificationService: Push permission denied.');
        return false;
      }

      // Configure default channel for Android compatibility
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      this.registerLifecycleListeners();
      this.isInitialized = true;
      
      // Reschedule reminders based on preferences
      await this.syncScheduledReminders();
      return true;
    } catch (error) {
      logger.error('NotificationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Generic trigger helper.
   */
  public async sendLocalNotification(title: string, message: string): Promise<void> {
    const notifyEnabled = await this.settingsService.getSetting('notify_sync_notifications');
    if (notifyEnabled === 'false') return;

    logger.debug(`NotificationService: Dispatching instant alert "${title}": ${message}`);
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // deliver immediately
    });
  }

  /**
   * Schedules recurring reminders based on user settings preferences.
   */
  public async syncScheduledReminders(): Promise<void> {
    logger.debug('NotificationService: Rescheduling local reminders...');
    
    // Clear all existing schedules to prevent duplicate delivery routes
    await Notifications.cancelAllScheduledNotificationsAsync();

    const preferences = await this.settingsService.getNotificationPreferences();

    // 1. Daily Reminder (8:00 PM)
    if (preferences.dailyReminder) {
      logger.debug('NotificationService: Scheduling daily reminder at 20:00');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Log your expenses 💰',
          body: "Keep Spendly updated! Don't forget to record today's transactions.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 20,
          minute: 0,
        } as any,
      });
    }

    // 2. Weekly Summary (Sunday 8:00 PM)
    if (preferences.weeklySummary) {
      logger.debug('NotificationService: Scheduling weekly summary reminder');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Weekly Finance Review 📈',
          body: 'Check out your spending summaries and weekly statistics inside Spendly.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1, // Sunday (1-indexed starting Sunday in Expo SchedulableTrigger)
          hour: 20,
          minute: 0,
        } as any,
      });
    }

    // 3. Monthly Summary (1st of month 8:00 PM)
    if (preferences.monthlySummary) {
      logger.debug('NotificationService: Scheduling monthly summary reminder');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Monthly Summary Ready 📅',
          body: 'Review your total expenditures, categories comparison, and budget details for last month.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: 1,
          hour: 20,
          minute: 0,
        } as any,
      });
    }
  }

  /**
   * Listen to write events in database to perform real-time threshold check calculations.
   */
  private registerLifecycleListeners() {
    const handleExpenseChange = async () => {
      try {
        const monthStr = getMonthStr(new Date());
        
        // Dynamically resolve BudgetService to prevent dependency loops during bootstrapping
        const { container } = require('@/di/ServiceContainer');
        const budgetService = container.resolve('BudgetService');
        
        const details = await budgetService.getBudgetDetails(monthStr);
        if (!details.budget || details.budget <= 0) return;

        const ratio = details.spent / details.budget;
        const preferences = await this.settingsService.getNotificationPreferences();
        if (!preferences.budgetAlerts) return;

        if (ratio >= 1.0) {
          const alreadyNotified = await this.settingsService.getSetting(`notified_budget_100_${monthStr}`);
          if (alreadyNotified !== 'true') {
            await this.sendLocalNotification(
              'Budget Exceeded 🚨',
              `You have exceeded 100% of your monthly budget limit. Spent: ₹${(details.spent / 100).toFixed(2)}`
            );
            await this.settingsService.setSetting(`notified_budget_100_${monthStr}`, 'true');
          }
        } else if (ratio >= 0.8) {
          const alreadyNotified = await this.settingsService.getSetting(`notified_budget_80_${monthStr}`);
          if (alreadyNotified !== 'true') {
            await this.sendLocalNotification(
              'Approaching Budget Limit ⚠️',
              `You have used 80% of your monthly budget limit. Spent: ₹${(details.spent / 100).toFixed(2)}`
            );
            await this.settingsService.setSetting(`notified_budget_80_${monthStr}`, 'true');
          }
        }
      } catch (err) {
        logger.error('NotificationService: Threshold calculation check failed:', err);
      }
    };

    eventEmitter.on(RepoEvents.ExpenseCreated, handleExpenseChange);
    eventEmitter.on(RepoEvents.ExpenseUpdated, handleExpenseChange);
  }
}
