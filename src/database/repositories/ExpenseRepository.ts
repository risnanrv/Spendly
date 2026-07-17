import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { logger } from '@/utils/logger';
import type { IExpenseRepository, ExpenseInsert, ExpenseUpdate } from './interfaces';
import type { Expense } from '@/models/domain';

// Helper to convert Firestore document to domain Expense model
export function mapDocToExpense(docSnap: any): Expense {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    amount: data.amount,
    categoryId: data.categoryId,
    title: data.title,
    note: data.note || null,
    date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

export class ExpenseRepository implements IExpenseRepository {
  public async createExpense(
    userId: string,
    data: ExpenseInsert,
    tx?: any
  ): Promise<Expense> {
    logger.debug(`ExpenseRepository: Saving expense in Firestore for user ${userId}`);
    const docRef = doc(collection(db, 'expenses'));
    const now = new Date();

    const insertValues = {
      id: docRef.id,
      userId,
      amount: data.amount,
      categoryId: data.categoryId,
      title: data.title,
      note: data.note || null,
      date: Timestamp.fromDate(data.date),
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      deletedAt: null,
    };

    await setDoc(docRef, insertValues);

    return {
      id: insertValues.id,
      amount: insertValues.amount,
      categoryId: insertValues.categoryId,
      title: insertValues.title,
      note: insertValues.note,
      date: data.date,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  public async updateExpense(
    userId: string,
    id: string,
    data: ExpenseUpdate,
    tx?: any
  ): Promise<void> {
    logger.debug(`ExpenseRepository: Updating expense ${id} in Firestore for user ${userId}`);
    const docRef = doc(db, 'expenses', id);
    const updateValues: Record<string, any> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (data.amount !== undefined) updateValues.amount = data.amount;
    if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
    if (data.title !== undefined) updateValues.title = data.title;
    if (data.note !== undefined) updateValues.note = data.note || null;
    if (data.date !== undefined) updateValues.date = Timestamp.fromDate(data.date);

    await updateDoc(docRef, updateValues);
  }

  public async deleteExpense(userId: string, id: string, tx?: any): Promise<void> {
    logger.debug(`ExpenseRepository: Soft-deleting expense ${id} in Firestore for user ${userId}`);
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  public async restoreExpense(userId: string, id: string, tx?: any): Promise<void> {
    logger.debug(`ExpenseRepository: Restoring expense ${id} in Firestore for user ${userId}`);
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  public async getExpenseById(userId: string, id: string): Promise<Expense | null> {
    const docRef = doc(db, 'expenses', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const expense = mapDocToExpense(snap);
    const data = snap.data();
    if (expense.deletedAt || data?.userId !== userId) return null;
    return expense;
  }

  public async getExpensesByMonth(userId: string, monthStr: string): Promise<Expense[]> {
    const [year, month] = monthStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    const results: Expense[] = [];

    snap.forEach((docSnap) => {
      const exp = mapDocToExpense(docSnap);
      if (!exp.deletedAt && exp.date >= startDate && exp.date <= endDate) {
        results.push(exp);
      }
    });

    return results;
  }

  public async searchExpenses(
    userId: string,
    queryStr: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<Expense[]> {
    return this.getExpenses(userId, { search: queryStr, ...options });
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
    const limitVal = options.limit ?? 100000;
    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const snap = await getDocs(q);
    let results: Expense[] = [];

    snap.forEach((docSnap) => {
      const exp = mapDocToExpense(docSnap);
      if (exp.deletedAt) return;

      // Filter by Category
      if (options.categoryId && exp.categoryId !== options.categoryId) return;

      // Filter by Search Query
      if (options.search && options.search.trim().length > 0) {
        const term = options.search.toLowerCase().trim();
        const titleMatch = exp.title.toLowerCase().includes(term);
        const noteMatch = exp.note ? exp.note.toLowerCase().includes(term) : false;
        if (!titleMatch && !noteMatch) return;
      }

      // Filter by Preset ranges
      if (options.filter && options.filter !== 'all') {
        const now = new Date();
        if (options.filter === 'today') {
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          if (exp.date < start || exp.date > end) return;
        } else if (options.filter === 'week') {
          const day = now.getDay();
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - day), 23, 59, 59, 999);
          if (exp.date < start || exp.date > end) return;
        } else if (options.filter === 'month') {
          const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          if (exp.date < start || exp.date > end) return;
        }
      }

      results.push(exp);
    });

    // Apply offset and limit client-side
    const offset = options.offset ?? 0;
    return results.slice(offset, offset + limitVal);
  }

  public async getCategoryTotals(
    userId: string,
    monthStr: string
  ): Promise<
    Array<{
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      categoryIcon: string;
      totalAmount: number;
    }>
  > {
    const monthlyExpenses = await this.getExpensesByMonth(userId, monthStr);
    
    // Fetch categories to resolve names & colors
    const catQuery = query(collection(db, 'categories'), where('userId', '==', userId));
    const catSnap = await getDocs(catQuery);
    const categoryMap = new Map<string, any>();
    catSnap.forEach((docSnap) => {
      categoryMap.set(docSnap.id, docSnap.data());
    });

    const totalsMap = new Map<string, number>();
    monthlyExpenses.forEach((exp) => {
      const current = totalsMap.get(exp.categoryId) || 0;
      totalsMap.set(exp.categoryId, current + exp.amount);
    });

    const results: any[] = [];
    totalsMap.forEach((totalAmount, categoryId) => {
      const cat = categoryMap.get(categoryId);
      results.push({
        categoryId,
        categoryName: cat?.name || 'Other',
        categoryColor: cat?.color || 'slate',
        categoryIcon: cat?.icon || 'grid',
        totalAmount,
      });
    });

    return results;
  }
}
