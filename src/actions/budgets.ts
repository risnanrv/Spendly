'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { budgetService, expenseRepo } from '@/lib/services';
import { db } from '@/lib/db';
import { monthlyBudgets } from '@/database/schema';
import { desc, and, eq, isNull } from 'drizzle-orm';
import { logger } from '@/utils/logger';

async function verifySession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getBudgetDetailsAction(monthStr: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const details = await budgetService.getBudgetDetails(userId, monthStr);
    return { success: true, data: details };
  } catch (error: any) {
    logger.error('getBudgetDetailsAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch budget details' };
  }
}

export async function saveBudgetAction(monthStr: string, amount: number) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    const res = await budgetService.saveBudget(userId, monthStr, amount);
    return { success: true, data: JSON.parse(JSON.stringify(res)) };
  } catch (error: any) {
    logger.error('saveBudgetAction failed:', error);
    return { success: false, error: error.message || 'Failed to save budget' };
  }
}

export async function deleteBudgetAction(monthStr: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await budgetService.deleteBudget(userId, monthStr);
    return { success: true };
  } catch (error: any) {
    logger.error('deleteBudgetAction failed:', error);
    return { success: false, error: error.message || 'Failed to delete budget' };
  }
}

export async function getBudgetHistoryAction() {
  try {
    const session = await verifySession();
    const userId = session.user.id;

    const budgets = await db
      .select({
        month: monthlyBudgets.month,
        amount: monthlyBudgets.amount,
      })
      .from(monthlyBudgets)
      .where(
        and(
          eq(monthlyBudgets.userId, userId),
          isNull(monthlyBudgets.deletedAt)
        )
      )
      .orderBy(desc(monthlyBudgets.month))
      .limit(6);

    const history = [];
    for (const b of budgets) {
      const expenses = await expenseRepo.getExpensesByMonth(userId, b.month);
      const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
      history.push({
        month: b.month,
        budget: b.amount,
        spent,
      });
    }

    return { success: true, data: history };
  } catch (error: any) {
    logger.error('getBudgetHistoryAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch budget history' };
  }
}
