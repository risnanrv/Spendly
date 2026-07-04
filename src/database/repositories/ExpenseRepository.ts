import crypto from 'crypto';
import { db } from '../../lib/db';
import { expenses, categories } from '../schema';
import { eq, and, isNull, desc, like, between, sql } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { IExpenseRepository, ExpenseInsert, ExpenseUpdate } from './interfaces';
import type { Expense } from '@/models/domain';

export class ExpenseRepository implements IExpenseRepository {
  public async createExpense(
    userId: string,
    data: ExpenseInsert,
    tx?: any
  ): Promise<Expense> {
    const runInTx = async (executor: any) => {
      const id = crypto.randomUUID();
      const now = new Date();

      const insertValues = {
        id,
        userId,
        amount: data.amount,
        categoryId: data.categoryId,
        title: data.title,
        note: data.note || null,
        date: data.date,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      logger.debug(`ExpenseRepository: Saving expense ${id} for user ${userId}`);
      await executor.insert(expenses).values(insertValues);

      return {
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
    };

    return tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
  }

  public async updateExpense(
    userId: string,
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

      logger.debug(`ExpenseRepository: Updating expense ${id} for user ${userId}`);
      await executor
        .update(expenses)
        .set(updateValues)
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
  }

  public async deleteExpense(userId: string, id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`ExpenseRepository: Soft-deleting expense ${id} for user ${userId}`);
      await executor
        .update(expenses)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
  }

  public async restoreExpense(userId: string, id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`ExpenseRepository: Restoring expense ${id} for user ${userId}`);
      await executor
        .update(expenses)
        .set({ deletedAt: null, updatedAt: now })
        .where(
          and(
            eq(expenses.id, id),
            eq(expenses.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
  }

  public async getExpenseById(userId: string, id: string): Promise<Expense | null> {
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
          eq(expenses.userId, userId),
          isNull(expenses.deletedAt)
        )
      )
      .limit(1);

    return results.length > 0 ? results[0] : null;
  }

  public async getExpensesByMonth(userId: string, monthStr: string): Promise<Expense[]> {
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
          eq(expenses.userId, userId),
          isNull(expenses.deletedAt),
          between(expenses.date, startDate, endDate)
        )
      )
      .orderBy(desc(expenses.date));

    return results;
  }

  public async searchExpenses(
    userId: string,
    query: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Expense[]> {
    return this.getExpenses(userId, { search: query, ...options });
  }

  public async getExpenses(
    userId: string,
    options: {
      filter?: 'today' | 'week' | 'month' | 'all';
      search?: string;
      limit?: number;
      offset?: number;
      categoryId?: string;
    } = {}
  ): Promise<Expense[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    let condition = and(
      eq(expenses.userId, userId),
      isNull(expenses.deletedAt)
    );

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
        condition = and(condition, between(expenses.date, start, end)) as any;
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

  public async getCategoryTotals(userId: string, monthStr: string): Promise<Array<{
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
        totalAmount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
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
      totalAmount: Number(row.totalAmount),
    }));
  }
}
