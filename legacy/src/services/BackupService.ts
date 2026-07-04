import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/database/client';
import * as schema from '@/database/schema';
import { logger } from '@/utils/logger';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';

export interface BackupPayload {
  app: 'Spendly';
  backupVersion: number;
  exportedAt: string;
  data: {
    expenses: any[];
    categories: any[];
    monthlyBudgets: any[];
    settings: any[];
    userPreferences: any[];
  };
}

/**
 * BackupService handles data backup exports to JSON shared files
 * and data restore validation check imports.
 */
export class BackupService {
  /**
   * Compiles SQLite database tables into a versioned JSON format and triggers native share sheets.
   */
  public async exportBackup(): Promise<void> {
    logger.info('BackupService: Executing table snapshot extraction...');
    
    try {
      const [expensesList, categoriesList, budgetsList, settingsList, preferencesList] = await Promise.all([
        db.select().from(schema.expenses),
        db.select().from(schema.categories),
        db.select().from(schema.monthlyBudgets),
        db.select().from(schema.settings),
        db.select().from(schema.userPreferences),
      ]);

      const backup: BackupPayload = {
        app: 'Spendly',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {
          expenses: expensesList,
          categories: categoriesList,
          monthlyBudgets: budgetsList,
          settings: settingsList,
          userPreferences: preferencesList,
        },
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const filePath = `${FileSystem.documentDirectory}spendly_backup_${Date.now()}.json`;

      logger.debug(`BackupService: Saving backup JSON file to ${filePath}`);
      await FileSystem.writeAsStringAsync(filePath, jsonStr, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Spendly Data Backup',
          UTI: 'public.json',
        });
      } else {
        throw new Error('Native Sharing utility is not available on this device environment.');
      }
    } catch (error) {
      logger.error('BackupService: Export backup failed:', error);
      throw error;
    }
  }

  /**
   * Triggers native DocumentPicker, reads backup JSON files, runs schema structure verification checks,
   * and overrides local tables inside a single transactional block.
   */
  public async importBackup(): Promise<boolean> {
    logger.info('BackupService: Querying backup document file selection...');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        logger.debug('BackupService: Document picker cancelled by user.');
        return false;
      }

      const fileUri = result.assets[0].uri;
      const fileContents = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const backup = JSON.parse(fileContents) as BackupPayload;

      // ── Step 1: Run validation checks ───────────────────────────────────────
      if (!backup || backup.app !== 'Spendly') {
        throw new Error('Selected backup file is invalid. Missing app identifier.');
      }
      if (backup.backupVersion !== 1) {
        throw new Error(`Incompatible backup version: ${backup.backupVersion}. Spendly expects version 1.`);
      }
      if (!backup.data) {
        throw new Error('Selected backup file is corrupt. Missing data details block.');
      }

      const { expenses, categories, monthlyBudgets: budgets, settings, userPreferences } = backup.data;
      if (!Array.isArray(expenses) || !Array.isArray(categories) || !Array.isArray(budgets)) {
        throw new Error('Invalid schema definition elements in data blocks.');
      }

      logger.info('BackupService: Schema verified. Committing SQLite writes transaction...');

      // ── Step 2: Clear and populate tables within SQLite transactions ────────
      await db.transaction(async (tx) => {
        // Clear all previous entries
        await tx.delete(schema.expenses);
        await tx.delete(schema.categories);
        await tx.delete(schema.monthlyBudgets);
        await tx.delete(schema.settings);
        await tx.delete(schema.userPreferences);

        // Date fields require conversion back to JavaScript Date instances
        if (categories.length > 0) {
          const parsedCategories = categories.map((c) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
          }));
          await tx.insert(schema.categories).values(parsedCategories);
        }

        if (expenses.length > 0) {
          const parsedExpenses = expenses.map((e) => ({
            ...e,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
            deletedAt: e.deletedAt ? new Date(e.deletedAt) : null,
          }));
          await tx.insert(schema.expenses).values(parsedExpenses);
        }

        if (budgets.length > 0) {
          const parsedBudgets = budgets.map((b) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
            deletedAt: b.deletedAt ? new Date(b.deletedAt) : null,
          }));
          await tx.insert(schema.monthlyBudgets).values(parsedBudgets);
        }

        if (Array.isArray(settings) && settings.length > 0) {
          const parsedSettings = settings.map((s) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
          await tx.insert(schema.settings).values(parsedSettings);
        }

        if (Array.isArray(userPreferences) && userPreferences.length > 0) {
          const parsedPrefs = userPreferences.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }));
          await tx.insert(schema.userPreferences).values(parsedPrefs);
        }
      });

      logger.info('BackupService: Data restored successfully.');
      
      // Trigger event notifications to refresh dashboard and report query caches
      eventEmitter.emit(RepoEvents.ExpenseCreated);
      eventEmitter.emit(RepoEvents.CategoryCreated);
      eventEmitter.emit(RepoEvents.BudgetSet);
      return true;
    } catch (err: any) {
      logger.error('BackupService: Restore backup failed:', err);
      throw new Error(`Data restoration failed: ${err.message || err}`);
    }
  }
}
