import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
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

    const docId = `${userId}_${monthStr}`;
    const docRef = doc(db, 'budgets', docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) return null;
    const data = snap.data();

    if (data.deletedAt) return null;

    return {
      id: docId,
      month: data.month,
      amount: data.amount,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    };
  }

  public async setBudget(
    userId: string,
    monthStr: string,
    amount: number,
    tx?: any
  ): Promise<MonthlyBudget> {
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }
    if (amount < 0) {
      throw new Error('Budget amount cannot be negative.');
    }

    const docId = `${userId}_${monthStr}`;
    const docRef = doc(db, 'budgets', docId);
    const snap = await getDoc(docRef);
    const now = new Date();

    logger.debug(`BudgetRepository: Setting budget for month ${monthStr} inside Firestore for user ${userId}`);

    if (snap.exists()) {
      await updateDoc(docRef, {
        amount,
        updatedAt: Timestamp.fromDate(now),
        deletedAt: null,
      });

      const oldData = snap.data();
      return {
        id: docId,
        month: monthStr,
        amount,
        createdAt: oldData.createdAt instanceof Timestamp ? oldData.createdAt.toDate() : new Date(oldData.createdAt),
        updatedAt: now,
      };
    } else {
      const budgetData = {
        id: docId,
        userId,
        month: monthStr,
        amount,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        deletedAt: null,
      };

      await setDoc(docRef, budgetData);

      return {
        id: docId,
        month: monthStr,
        amount,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  public async deleteBudget(userId: string, monthStr: string, tx?: any): Promise<void> {
    if (!validateMonthFormat(monthStr)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }

    logger.debug(`BudgetRepository: Soft-deleting budget for month ${monthStr} inside Firestore for user ${userId}`);
    const docId = `${userId}_${monthStr}`;
    const docRef = doc(db, 'budgets', docId);

    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }
}
