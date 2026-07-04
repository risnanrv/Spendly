import { db } from '../../lib/db';
import { expenses, categories } from '../schema';
import { eq, and, isNull, gte, lte } from 'drizzle-orm';

export interface RawExpenseRow {
  id: string;
  amount: number;
  categoryId: string;
  title: string;
  note: string | null;
  date: Date;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

/**
 * Fetches all active expenses with their category details for a date range.
 * Used exclusively by ReportService to power all report aggregations.
 */
export const fetchExpensesWithCategories = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RawExpenseRow[]> => {
  const rows = await db
    .select({
      id: expenses.id,
      amount: expenses.amount,
      categoryId: expenses.categoryId,
      title: expenses.title,
      note: expenses.note,
      date: expenses.date,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(expenses)
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(
      and(
        eq(expenses.userId, userId),
        isNull(expenses.deletedAt),
        gte(expenses.date, startDate),
        lte(expenses.date, endDate)
      )
    )
    .orderBy(expenses.date);

  return rows;
};
