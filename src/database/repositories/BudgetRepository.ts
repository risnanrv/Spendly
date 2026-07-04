import crypto from 'crypto';
import { db } from '../../lib/db';
import { monthlyBudgets } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { IBudgetRepository } from './interfaces';
import type { MonthlyBudget } from '@/models/domain';

const validateMonthFormat = (month: string): boolean => {
  const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;
  return monthRegex.test(month);
};

export class BudgetRepository implements IBudgetRepository {
  public async getCurrentBudget(userId: string, monthStr: string): Promise<MonthlyBudget | null> {
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }

    const budgets = await db
      .select()
      .from(monthlyBudgets)
      .where(
        and(
          eq(monthlyBudgets.userId, userId),
          eq(monthlyBudgets.month, monthStr),
          isNull(monthlyBudgets.deletedAt)
        )
      )
      .limit(1);

    if (budgets.length === 0) return null;

    return {
      id: budgets[0].id,
      month: budgets[0].month,
      amount: budgets[0].amount,
      createdAt: budgets[0].createdAt,
      updatedAt: budgets[0].updatedAt,
    };
  }

  public async setBudget(
    userId: string,
    monthStr: string,
    amount: number,
    tx?: any
  ): Promise<MonthlyBudget> {
    const runInTx = async (executor: any) => {
      if (!validateMonthFormat(monthStr)) {
        throw new Error('Invalid month format. Expected YYYY-MM.');
      }
      if (amount < 0) {
        throw new Error('Budget amount cannot be negative.');
      }

      const now = new Date();
      logger.debug(`BudgetRepository: Setting budget for month ${monthStr} for user ${userId}`);

      const existing = await executor
        .select()
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.userId, userId),
            eq(monthlyBudgets.month, monthStr),
            isNull(monthlyBudgets.deletedAt)
          )
        )
        .limit(1);

      let budgetResult: MonthlyBudget;

      if (existing.length > 0) {
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
      } else {
        const id = crypto.randomUUID();
        const insertValues = {
          id,
          userId,
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
      }

      return budgetResult;
    };

    return tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
  }

  public async deleteBudget(userId: string, monthStr: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      if (!validateMonthFormat(monthStr)) {
        throw new Error('Invalid month format. Expected YYYY-MM.');
      }

      logger.debug(`BudgetRepository: Soft-deleting budget for month ${monthStr} for user ${userId}`);
      const now = new Date();

      const existing = await executor
        .select()
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.userId, userId),
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
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
  }
}
