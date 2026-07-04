'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { expenses, categories } from '@/database/schema';
import { eq, and, isNull, desc, like, gte, lte } from 'drizzle-orm';
import { expenseService } from '@/lib/services';
import type { ExpenseInsert, ExpenseUpdate } from '@/database/repositories/interfaces';
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

export interface GetExpensesFilters {
  monthStr?: string; // YYYY-MM
  categoryId?: string;
  search?: string;
}

export async function getExpensesAction(filters: GetExpensesFilters = {}) {
  try {
    const session = await verifySession();
    const userId = session.user.id;

    let conditions = and(
      eq(expenses.userId, userId),
      isNull(expenses.deletedAt)
    );

    if (filters.search && filters.search.trim().length > 0) {
      conditions = and(conditions, like(expenses.title, `%${filters.search.trim()}%`)) as any;
    }

    if (filters.categoryId) {
      conditions = and(conditions, eq(expenses.categoryId, filters.categoryId)) as any;
    }

    if (filters.monthStr) {
      const [year, month] = filters.monthStr.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      conditions = and(conditions, gte(expenses.date, startDate), lte(expenses.date, endDate)) as any;
    }

    const rows = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        categoryId: expenses.categoryId,
        title: expenses.title,
        note: expenses.note,
        date: expenses.date,
        createdAt: expenses.createdAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
      })
      .from(expenses)
      .innerJoin(categories, eq(expenses.categoryId, categories.id))
      .where(conditions)
      .orderBy(desc(expenses.date));

    // Serialize Dates for server action response boundaries
    return { success: true, data: JSON.parse(JSON.stringify(rows)) };
  } catch (error: any) {
    logger.error('getExpensesAction failed:', error);
    return { success: false, error: error.message || 'Failed to fetch expenses' };
  }
}

export async function createExpenseAction(data: {
  title: string;
  amount: number;
  categoryId: string;
  dateStr: string;
  note?: string;
}) {
  try {
    const session = await verifySession();
    const userId = session.user.id;

    const insertData: ExpenseInsert = {
      title: data.title,
      amount: data.amount,
      categoryId: data.categoryId,
      date: new Date(data.dateStr),
    };
    if (data.note) {
      insertData.note = data.note;
    }

    const res = await expenseService.createExpense(userId, insertData);
    return { success: true, data: JSON.parse(JSON.stringify(res)) };
  } catch (error: any) {
    logger.error('createExpenseAction failed:', error);
    return { success: false, error: error.message || 'Failed to create expense' };
  }
}

export async function updateExpenseAction(
  id: string,
  data: {
    title?: string;
    amount?: number;
    categoryId?: string;
    dateStr?: string;
    note?: string;
  }
) {
  try {
    const session = await verifySession();
    const userId = session.user.id;

    const updateData: ExpenseUpdate = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.dateStr !== undefined) updateData.date = new Date(data.dateStr);
    if (data.note !== undefined) updateData.note = data.note;

    await expenseService.updateExpense(userId, id, updateData);
    return { success: true };
  } catch (error: any) {
    logger.error('updateExpenseAction failed:', error);
    return { success: false, error: error.message || 'Failed to update expense' };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    const session = await verifySession();
    const userId = session.user.id;
    await expenseService.deleteExpense(userId, id);
    return { success: true };
  } catch (error: any) {
    logger.error('deleteExpenseAction failed:', error);
    return { success: false, error: error.message || 'Failed to delete expense' };
  }
}
