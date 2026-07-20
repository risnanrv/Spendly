import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { mapDocToExpense } from '../repositories/ExpenseRepository';
import { mapDocToCategory } from '../repositories/CategoryRepository';

export interface RawExpenseRow {
  id: string;
  amount: number;
  categoryId: string;
  title: string | null;
  note: string | null;
  date: Date;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
}

/**
 * Fetches all active expenses with their category details for a date range.
 * Used by ReportService to power all report aggregations.
 */
export const fetchExpensesWithCategories = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<RawExpenseRow[]> => {
  // 1. Fetch user's categories to map details in memory (Inner Join simulation)
  const catQuery = query(collection(db, 'categories'), where('userId', '==', userId));
  const catSnap = await getDocs(catQuery);
  const categoriesMap = new Map<string, any>();
  
  catSnap.forEach((docSnap) => {
    categoriesMap.set(docSnap.id, mapDocToCategory(docSnap));
  });

  // 2. Fetch user's expenses
  const expQuery = query(
    collection(db, 'expenses'),
    where('userId', '==', userId),
    orderBy('date', 'asc')
  );
  const expSnap = await getDocs(expQuery);
  
  const results: RawExpenseRow[] = [];
  expSnap.forEach((docSnap) => {
    const exp = mapDocToExpense(docSnap);
    
    if (exp.deletedAt) return;
    
    // Filter by date range boundary
    if (exp.date < startDate || exp.date > endDate) return;

    const cat = categoriesMap.get(exp.categoryId);
    if (!cat) return; // Simulates an INNER JOIN - drops uncategorized or deleted categories

    results.push({
      id: exp.id,
      amount: exp.amount,
      categoryId: exp.categoryId,
      title: exp.title,
      note: exp.note,
      date: exp.date,
      categoryName: cat.name,
      categoryColor: cat.color,
      categoryIcon: cat.icon,
    });
  });

  return results;
};
