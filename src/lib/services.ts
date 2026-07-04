import { ExpenseRepository } from '@/database/repositories/ExpenseRepository';
import { CategoryRepository } from '@/database/repositories/CategoryRepository';
import { BudgetRepository } from '@/database/repositories/BudgetRepository';
import { SettingsRepository } from '@/database/repositories/SettingsRepository';
import { PreferencesRepository } from '@/database/repositories/PreferencesRepository';

import { ExpenseService } from '@/services/ExpenseService';
import { CategoryService } from '@/services/CategoryService';
import { BudgetService } from '@/services/BudgetService';
import { SettingsService } from '@/services/SettingsService';
import { PreferencesService } from '@/services/PreferencesService';
import { ReportService } from '@/services/ReportService';
import { DashboardService } from '@/services/DashboardService';
import { AnalyticsService } from '@/services/AnalyticsService';
import { ProfileService } from '@/services/ProfileService';
import { BackupService } from '@/services/BackupService';
import { ExportService } from '@/services/ExportService';

// Singleton Repositories
export const expenseRepo = new ExpenseRepository();
export const categoryRepo = new CategoryRepository();
export const budgetRepo = new BudgetRepository();
export const settingsRepo = new SettingsRepository();
export const preferencesRepo = new PreferencesRepository();

// Singleton Services
export const settingsService = new SettingsService(settingsRepo);
export const preferencesService = new PreferencesService(preferencesRepo);
export const expenseService = new ExpenseService(expenseRepo);
export const reportService = new ReportService();
export const categoryService = new CategoryService(categoryRepo, expenseRepo);
export const budgetService = new BudgetService(budgetRepo, expenseRepo);
export const dashboardService = new DashboardService(expenseRepo, categoryRepo, budgetRepo, reportService);
export const analyticsService = new AnalyticsService();
export const profileService = new ProfileService(settingsService);
export const backupService = new BackupService();
export const exportService = new ExportService();
