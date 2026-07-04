import { db } from '@/database/client';
import { logger } from '@/utils/logger';
import { sessionManager } from '@/utils/session';
import { ExpenseRepository } from '@/database/repositories/ExpenseRepository';
import { CategoryRepository } from '@/database/repositories/CategoryRepository';
import { BudgetRepository } from '@/database/repositories/BudgetRepository';
import { SettingsRepository } from '@/database/repositories/SettingsRepository';
import { PreferencesRepository } from '@/database/repositories/PreferencesRepository';
import { SyncRepository } from '@/database/repositories/SyncRepository';
import { SettingsService } from '@/services/SettingsService';
import { PreferencesService } from '@/services/PreferencesService';
import { ExpenseService } from '@/services/ExpenseService';
import { DashboardService } from '@/services/DashboardService';
import { BudgetService } from '@/services/BudgetService';
import { CategoryService } from '@/services/CategoryService';
import { NotificationService } from '@/services/NotificationService';
import { ProfileService } from '@/services/ProfileService';
import { SyncService } from '@/services/SyncService';
import { PushService } from '@/sync/PushService';
import { PullService } from '@/sync/PullService';
import { SyncEngine } from '@/sync/SyncEngine';
import { SyncScheduler } from '@/sync/SyncScheduler';
import { ReportService } from '@/services/ReportService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { BackupService } from '@/services/BackupService';
import { ExportService } from '@/services/ExportService';

/**
 * ServiceContainer registers and resolves application dependencies
 * to decouple concrete implementations from UI consumption.
 */
class ServiceContainer {
  private instances = new Map<string, any>();

  public register(token: string, instance: any) {
    this.instances.set(token, instance);
  }

  public resolve<T>(token: string): T {
    const instance = this.instances.get(token);
    if (!instance) {
      throw new Error(`ServiceContainer: Dependency token "${token}" could not be resolved.`);
    }
    return instance;
  }
}

export const container = new ServiceContainer();

// Setup strongly-typed token identifiers
export const DI_TOKENS = {
  Database: 'Database',
  Logger: 'Logger',
  SessionManager: 'SessionManager',
  ExpenseRepository: 'IExpenseRepository',
  CategoryRepository: 'ICategoryRepository',
  BudgetRepository: 'IBudgetRepository',
  SettingsRepository: 'ISettingsRepository',
  PreferencesRepository: 'IPreferencesRepository',
  SyncRepository: 'ISyncRepository',
  SettingsService: 'SettingsService',
  PreferencesService: 'PreferencesService',
  ExpenseService: 'ExpenseService',
  DashboardService: 'DashboardService',
  BudgetService: 'BudgetService',
  CategoryService: 'CategoryService',
  SyncService: 'SyncService',
  NotificationService: 'NotificationService',
  ReportService: 'ReportService',
  AnalyticsService: 'AnalyticsService',
  ProfileService: 'ProfileService',
  BackupService: 'BackupService',
  ExportService: 'ExportService',
} as const;

/**
 * Initializes and wires all dependencies inside the ServiceContainer registry.
 */
export const initializeDIContainer = () => {
  container.register(DI_TOKENS.Database, db);
  container.register(DI_TOKENS.Logger, logger);
  container.register(DI_TOKENS.SessionManager, sessionManager);

  // Instantiate repositories
  const expenseRepo = new ExpenseRepository();
  const categoryRepo = new CategoryRepository();
  const budgetRepo = new BudgetRepository();
  const settingsRepo = new SettingsRepository();
  const preferencesRepo = new PreferencesRepository();
  const syncRepo = new SyncRepository();

  container.register(DI_TOKENS.ExpenseRepository, expenseRepo);
  container.register(DI_TOKENS.CategoryRepository, categoryRepo);
  container.register(DI_TOKENS.BudgetRepository, budgetRepo);
  container.register(DI_TOKENS.SettingsRepository, settingsRepo);
  container.register(DI_TOKENS.PreferencesRepository, preferencesRepo);
  container.register(DI_TOKENS.SyncRepository, syncRepo);

  // Instantiate services with injected repository instances
  container.register(DI_TOKENS.SettingsService, new SettingsService(settingsRepo));
  container.register(DI_TOKENS.PreferencesService, new PreferencesService(preferencesRepo));
  container.register(DI_TOKENS.ExpenseService, new ExpenseService(expenseRepo));
  container.register(DI_TOKENS.DashboardService, new DashboardService(expenseRepo, categoryRepo, budgetRepo));
  container.register(DI_TOKENS.BudgetService, new BudgetService(budgetRepo, expenseRepo));
  container.register(DI_TOKENS.CategoryService, new CategoryService(categoryRepo, expenseRepo));
  
  // Setup sync system
  const pushService = new PushService(syncRepo);
  const pullService = new PullService();
  const syncEngine = new SyncEngine(pushService, pullService);
  const syncScheduler = new SyncScheduler(syncEngine, syncRepo);
  const realSyncService = new SyncService(syncEngine, syncScheduler);

  const settingsService = container.resolve<SettingsService>(DI_TOKENS.SettingsService);
  const notificationService = new NotificationService(settingsService);
  
  container.register(DI_TOKENS.SyncService, realSyncService);
  container.register(DI_TOKENS.NotificationService, notificationService);
  container.register(DI_TOKENS.ReportService, new ReportService());
  container.register(DI_TOKENS.AnalyticsService, new AnalyticsService());
  container.register(DI_TOKENS.ProfileService, new ProfileService(settingsService));
  container.register(DI_TOKENS.BackupService, new BackupService());
  container.register(DI_TOKENS.ExportService, new ExportService());

  logger.info('Dependency Injection ServiceContainer fully loaded.');
};
