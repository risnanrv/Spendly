import { db } from '@/lib/db';
import * as schema from '@/database/schema';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';

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

export class BackupService {
  /**
   * Compiles SQLite database tables for a specific user and returns a versioned BackupPayload object.
   */
  public async getBackupData(userId: string): Promise<BackupPayload> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    logger.info(`BackupService: Executing table snapshot extraction for user ${userId}...`);
    
    try {
      const [expensesList, categoriesList, budgetsList, settingsList, preferencesList] = await Promise.all([
        db.select().from(schema.expenses).where(eq(schema.expenses.userId, userId)),
        db.select().from(schema.categories).where(eq(schema.categories.userId, userId)), // Only custom categories exported
        db.select().from(schema.monthlyBudgets).where(eq(schema.monthlyBudgets.userId, userId)),
        db.select().from(schema.settings).where(eq(schema.settings.userId, userId)),
        db.select().from(schema.userPreferences).where(eq(schema.userPreferences.userId, userId)),
      ]);

      return {
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
    } catch (error) {
      logger.error(`BackupService: Export backup data compile failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Imports backup JSON contents, maps them to the active user, and overrides the user's tables.
   */
  public async restoreBackup(userId: string, backup: BackupPayload): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    logger.info(`BackupService: Committing SQLite restore writes transaction for user ${userId}...`);
    
    try {
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

      // Clear and populate user-specific rows within a transaction
      await db.transaction(async (tx) => {
        // Clear previous user-specific entries
        await tx.delete(schema.expenses).where(eq(schema.expenses.userId, userId));
        await tx.delete(schema.categories).where(eq(schema.categories.userId, userId));
        await tx.delete(schema.monthlyBudgets).where(eq(schema.monthlyBudgets.userId, userId));
        await tx.delete(schema.settings).where(eq(schema.settings.userId, userId));
        await tx.delete(schema.userPreferences).where(eq(schema.userPreferences.userId, userId));

        if (categories.length > 0) {
          const parsedCategories = categories.map((c) => ({
            id: c.id,
            userId: userId, // Enforce active user ID
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type,
            isSystem: false,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
          }));
          await tx.insert(schema.categories).values(parsedCategories);
        }

        if (expenses.length > 0) {
          const parsedExpenses = expenses.map((e) => ({
            id: e.id,
            userId: userId, // Enforce active user ID
            amount: e.amount,
            categoryId: e.categoryId,
            title: e.title,
            note: e.note || null,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
            deletedAt: e.deletedAt ? new Date(e.deletedAt) : null,
          }));
          await tx.insert(schema.expenses).values(parsedExpenses);
        }

        if (budgets.length > 0) {
          const parsedBudgets = budgets.map((b) => ({
            id: b.id,
            userId: userId, // Enforce active user ID
            month: b.month,
            amount: b.amount,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
            deletedAt: b.deletedAt ? new Date(b.deletedAt) : null,
          }));
          await tx.insert(schema.monthlyBudgets).values(parsedBudgets);
        }

        if (Array.isArray(settings) && settings.length > 0) {
          const parsedSettings = settings.map((s) => ({
            userId: userId, // Enforce active user ID
            key: s.key,
            value: s.value,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
          await tx.insert(schema.settings).values(parsedSettings);
        }

        if (Array.isArray(userPreferences) && userPreferences.length > 0) {
          const parsedPrefs = userPreferences.map((p) => ({
            userId: userId, // Enforce active user ID
            key: p.key,
            value: p.value,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          }));
          await tx.insert(schema.userPreferences).values(parsedPrefs);
        }
      });

      logger.info(`BackupService: Data restored successfully for user ${userId}.`);
      return true;
    } catch (err: any) {
      logger.error(`BackupService: Restore backup failed for user ${userId}:`, err);
      throw new Error(`Data restoration failed: ${err.message || err}`);
    }
  }
}
