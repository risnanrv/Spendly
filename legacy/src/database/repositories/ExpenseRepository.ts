import * as Crypto from 'expo-crypto';
import { db } from '../client';
import { expenses, categories } from '../schema';
import { eq, and, isNull, desc, like, between } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import type { IExpenseRepository, ExpenseInsert, ExpenseUpdate } from './interfaces';
import type { Expense } from '@/models/domain';

/**
 * ExpenseRepository handles SQLite persistence for expenses.
 * Contains no business logic/validations.
 */
export class ExpenseRepository implements IExpenseRepository {
  /**
   * Inserts an expense record directly.
   */
  public async createExpense(
    data: ExpenseInsert,
    tx?: any
  ): Promise<Expense> {
    const runInTx = async (executor: any) => {
      const id = Crypto.randomUUID();
      const now = new Date();

      const insertValues = {
        id,
        amount: data.amount,
        categoryId: data.categoryId,
        title: data.title,
        note: data.note || null,
        date: data.date,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      logger.debug(`ExpenseRepository: Saving expense ${id}`);
      await executor.insert(expenses).values(insertValues);

      const createdExpense: Expense = {
        id: insertValues.id,
        amount: insertValues.amount,
        categoryId: insertValues.categoryId,
        title: insertValues.title,
        note: insertValues.note,
        date: insertValues.date,
        createdAt: insertValues.createdAt,
        updatedAt: insertValues.updatedAt,
        deletedAt: insertValues.deletedAt,
      };

      // Enqueue sync change in same transaction
      try {
        const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
        await syncRepo.enqueueChange({
          table: 'expenses',
          action: 'insert',
          recordId: id,
          payload: {
            id,
            amount: data.amount,
            categoryId: data.categoryId,
            title: data.title,
            note: data.note || null,
            date: data.date.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            deletedAt: null,
          },
          priority: 'high',
        }, executor);
      } catch (err) {
        logger.error('Failed to enqueue sync change for createExpense:', err);
      }

      return createdExpense;
    };

    const result = tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.ExpenseCreated, result);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}

    return result;
  }

  /**
   * Updates an expense record directly.
   */
  public async updateExpense(
    id: string,
    data: ExpenseUpdate,
    tx?: any
  ): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      const updateValues: Record<string, any> = {
        updatedAt: now,
      };

      if (data.amount !== undefined) updateValues.amount = data.amount;
      if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
      if (data.title !== undefined) updateValues.title = data.title;
      if (data.note !== undefined) updateValues.note = data.note || null;
      if (data.date !== undefined) updateValues.date = data.date;

      logger.debug(`ExpenseRepository: Updating expense ${id}`);
      await executor
        .update(expenses)
        .set(updateValues)
        .where(eq(expenses.id, id));

      const updatedRecord = await executor
        .select()
        .from(expenses)
        .where(eq(expenses.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'expenses',
            action: 'update',
            recordId: id,
            payload: {
              id: record.id,
              amount: record.amount,
              categoryId: record.categoryId,
              title: record.title,
              note: record.note,
              date: record.date.toISOString(),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for updateExpense:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.ExpenseUpdated, { id, ...data });

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Soft deletes an expense.
   */
  public async deleteExpense(id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`ExpenseRepository: Soft-deleting expense ${id}`);
      await executor
        .update(expenses)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(expenses.id, id));

      const updatedRecord = await executor
        .select()
        .from(expenses)
        .where(eq(expenses.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'expenses',
            action: 'update', // treated as update for deletedAt column sync
            recordId: id,
            payload: {
              id: record.id,
              amount: record.amount,
              categoryId: record.categoryId,
              title: record.title,
              note: record.note,
              date: record.date.toISOString(),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: record.deletedAt.toISOString(),
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for deleteExpense:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.ExpenseDeleted, id);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Restores a soft-deleted expense.
   */
  public async restoreExpense(id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`ExpenseRepository: Restoring expense ${id}`);
      await executor
        .update(expenses)
        .set({ deletedAt: null, updatedAt: now })
        .where(eq(expenses.id, id));

      const updatedRecord = await executor
        .select()
        .from(expenses)
        .where(eq(expenses.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'expenses',
            action: 'update',
            recordId: id,
            payload: {
              id: record.id,
              amount: record.amount,
              categoryId: record.categoryId,
              title: record.title,
              note: record.note,
              date: record.date.toISOString(),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for restoreExpense:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    eventEmitter.emit(RepoEvents.ExpenseRestored, id);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Retrieves a single active expense record by ID.
   */
  public async getExpenseById(id: string): Promise<Expense | null> {
    const results = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        title: expenses.title,
        note: expenses.note,
        date: expenses.date,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        deletedAt: expenses.deletedAt,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          isNull(expenses.deletedAt)
        )
      )
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  /**
   * Retrieves active expenses for a specific month.
   */
  public async getExpensesByMonth(monthStr: string): Promise<Expense[]> {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        title: expenses.title,
        note: expenses.note,
        date: expenses.date,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        deletedAt: expenses.deletedAt,
      })
      .from(expenses)
      .where(
        and(
          isNull(expenses.deletedAt),
          between(expenses.date, startDate, endDate)
        )
      )
      .orderBy(desc(expenses.date));

    return results;
  }

  /**
   * Search active expenses.
   */
  public async searchExpenses(
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Expense[]> {
    const queryParams: any = { search: query };
    if (options.limit !== undefined) queryParams.limit = options.limit;
    if (options.offset !== undefined) queryParams.offset = options.offset;
    return this.getExpenses(queryParams);
  }

  /**
   * Query records applying search, filtering, and pagination keys.
   */
  public async getExpenses(options: {
    filter?: 'today' | 'week' | 'month' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
    categoryId?: string;
  } = {}): Promise<Expense[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    let condition = isNull(expenses.deletedAt);

    if (options.search && options.search.trim().length > 0) {
      condition = and(condition, like(expenses.title, `%${options.search.trim()}%`)) as any;
    }

    if (options.categoryId) {
      condition = and(condition, eq(expenses.categoryId, options.categoryId)) as any;
    }

    if (options.filter && options.filter !== 'all') {
      const now = new Date();
      if (options.filter === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        condition = and(condition, between(expenses.date, start, end)) as any;
      } else if (options.filter === 'week') {
        const day = now.getDay();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - day), 23, 59, 59, 999);
        condition = and(condition, between(expenses.date, start, end)) as any;
      } else if (options.filter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        condition = new Date(start) <= new Date(end) ? and(condition, between(expenses.date, start, end)) as any : condition;
      }
    }

    const results = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        title: expenses.title,
        note: expenses.note,
        date: expenses.date,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        deletedAt: expenses.deletedAt,
      })
      .from(expenses)
      .where(condition)
      .orderBy(desc(expenses.date))
      .limit(limit)
      .offset(offset);

    return results;
  }

  /**
   * Retrieves category totals (sum of amounts) for a specific month.
   */
  public async getCategoryTotals(monthStr: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    totalAmount: number;
  }>> {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        totalAmount: db.$count(expenses), // Placeholder totals aggregation
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          isNull(expenses.deletedAt),
          between(expenses.date, startDate, endDate)
        )
      )
      .groupBy(expenses.categoryId, categories.name, categories.color, categories.icon);

    return results.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      categoryColor: row.categoryColor,
      categoryIcon: row.categoryIcon,
      totalAmount: 0, // Inactive aggregate in local view
    }));
  }
}
