import * as Crypto from 'expo-crypto';
import { db } from '../client';
import { monthlyBudgets } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import type { IBudgetRepository } from './interfaces';
import type { MonthlyBudget } from '@/models/domain';

const validateMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};

/**
 * BudgetRepository handles setting and retrieving the single monthly budget.
 */
export class BudgetRepository implements IBudgetRepository {
  /**
   * Retrieves the monthly budget for the target month.
   * monthStr format: "YYYY-MM"
   */
  public async getCurrentBudget(monthStr: string): Promise<MonthlyBudget | null> {
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }

    const budgets = await db
      .select()
      .from(monthlyBudgets)
      .where(
        and(
          eq(monthlyBudgets.month, monthStr),
          isNull(monthlyBudgets.deletedAt)
        )
      )
      .limit(1);

    if (budgets.length === 0) return null;

    return {
      id: budgets[0].id,
      month: budgets[0].month,
      amount: budgets[0].amount, // Cents/paisa integer
      createdAt: budgets[0].createdAt,
      updatedAt: budgets[0].updatedAt,
    };
  }

  /**
   * Configures (upserts) the monthly budget for the target month.
   */
  public async setBudget(
    monthStr: string,
    amount: number,
    tx?: any
  ): Promise<MonthlyBudget> {
    const runInTx = async (executor: any) => {
      // 1. Validation
      if (!validateMonthFormat(monthStr)) {
        throw new Error('Invalid month format. Expected YYYY-MM.');
      }
      if (amount < 0) {
        throw new Error('Budget amount cannot be negative.');
      }

      const now = new Date();
      logger.debug(`BudgetRepository: Setting budget for month ${monthStr}`);

      // Query if budget exists
      const existing = await executor
        .select()
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.month, monthStr),
            isNull(monthlyBudgets.deletedAt)
          )
        )
        .limit(1);

      let budgetResult: MonthlyBudget;

      if (existing.length > 0) {
        // Update
        const record = existing[0];
        await executor
          .update(monthlyBudgets)
          .set({
            amount: amount,
            updatedAt: now,
          })
          .where(eq(monthlyBudgets.id, record.id));
        
        budgetResult = {
          id: record.id,
          month: monthStr,
          amount: amount,
          createdAt: record.createdAt,
          updatedAt: now,
        };

        // Enqueue sync change
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'budgets',
            action: 'update',
            recordId: record.id,
            payload: {
              id: record.id,
              month: monthStr,
              amount: amount,
              createdAt: record.createdAt.toISOString(),
              updatedAt: now.toISOString(),
              deletedAt: null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for update budget:', err);
        }
      } else {
        // Create new
        const id = Crypto.randomUUID();
        const insertValues = {
          id,
          month: monthStr,
          amount: amount,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };

        await executor.insert(monthlyBudgets).values(insertValues);

        budgetResult = {
          id,
          month: monthStr,
          amount: amount,
          createdAt: now,
          updatedAt: now,
        };

        // Enqueue sync change
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'budgets',
            action: 'insert',
            recordId: id,
            payload: {
              id,
              month: monthStr,
              amount: amount,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
              deletedAt: null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for create budget:', err);
        }
      }

      return budgetResult;
    };

    const result = tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.BudgetSet, result);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}

    return result;
  }

  /**
   * Soft deletes the budget for the target month.
   */
  public async deleteBudget(monthStr: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      if (!validateMonthFormat(monthStr)) {
        throw new Error('Invalid month format. Expected YYYY-MM.');
      }

      logger.debug(`BudgetRepository: Soft-deleting budget for month ${monthStr}`);

      const now = new Date();

      // Find the budget first to know its record ID
      const existing = await executor
        .select()
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.month, monthStr),
            isNull(monthlyBudgets.deletedAt)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const record = existing[0];
        await executor
          .update(monthlyBudgets)
          .set({
            deletedAt: now,
            updatedAt: now,
          })
          .where(eq(monthlyBudgets.id, record.id));

        // Enqueue sync change (treated as update since it updates deletedAt column)
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'budgets',
            action: 'update',
            recordId: record.id,
            payload: {
              id: record.id,
              month: record.month,
              amount: record.amount,
              createdAt: record.createdAt.toISOString(),
              updatedAt: now.toISOString(),
              deletedAt: now.toISOString(),
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for delete budget:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.BudgetDeleted, monthStr);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }
}
