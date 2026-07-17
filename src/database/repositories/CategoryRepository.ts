import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { logger } from '@/utils/logger';
import type { ICategoryRepository, CategoryInsert, CategoryUpdate } from './interfaces';
import type { Category } from '@/models/domain';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'utensils', color: 'orange', type: 'expense' },
  { name: 'Transport', icon: 'car', color: 'blue', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', color: 'purple', type: 'expense' },
  { name: 'Bills', icon: 'receipt', color: 'red', type: 'expense' },
  { name: 'Entertainment', icon: 'film', color: 'pink', type: 'expense' },
  { name: 'Healthcare', icon: 'heart-pulse', color: 'emerald', type: 'expense' },
  { name: 'Education', icon: 'graduation-cap', color: 'violet', type: 'expense' },
  { name: 'Travel', icon: 'plane', color: 'cyan', type: 'expense' },
  { name: 'Subscriptions', icon: 'credit-card', color: 'amber', type: 'expense' },
  { name: 'Other', icon: 'grid', color: 'slate', type: 'expense' },
  { name: 'Salary', icon: 'briefcase', color: 'green', type: 'income' },
];

export function mapDocToCategory(docSnap: any): Category {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type as 'expense' | 'income',
    isSystem: Boolean(data.isSystem),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate() : null,
  };
}

export class CategoryRepository implements ICategoryRepository {
  public static clearCache(userId?: string): void {
    // Left for interface signature compatibility.
  }

  private async seedUserCategories(userId: string): Promise<Category[]> {
    logger.debug(`CategoryRepository: Seeding default categories for user ${userId}`);
    const batch = writeBatch(db);
    const now = new Date();
    const seededCategories: Category[] = [];

    for (const cat of DEFAULT_CATEGORIES) {
      const docRef = doc(collection(db, 'categories'));
      const categoryData = {
        id: docRef.id,
        userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isSystem: true,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        deletedAt: null,
      };

      batch.set(docRef, categoryData);
      
      seededCategories.push({
        id: categoryData.id,
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        type: categoryData.type as 'expense' | 'income',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    await batch.commit();
    return seededCategories;
  }

  public async getCategories(userId: string): Promise<Category[]> {
    const q = query(
      collection(db, 'categories'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      // Lazy seed on first read if empty
      return this.seedUserCategories(userId);
    }

    const results: Category[] = [];
    snap.forEach((docSnap) => {
      const cat = mapDocToCategory(docSnap);
      if (!cat.deletedAt) {
        results.push(cat);
      }
    });

    return results;
  }

  public async getCategoryById(userId: string, id: string): Promise<Category | null> {
    const docRef = doc(db, 'categories', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    if (data?.userId !== userId) return null;
    return mapDocToCategory(snap);
  }

  public async createCategory(
    userId: string,
    data: CategoryInsert,
    tx?: any
  ): Promise<Category> {
    logger.debug(`CategoryRepository: Creating custom category inside Firestore for user ${userId}`);
    const docRef = doc(collection(db, 'categories'));
    const now = new Date();

    const insertValues = {
      id: docRef.id,
      userId,
      name: data.name.trim(),
      icon: data.icon.trim(),
      color: data.color.trim(),
      type: data.type,
      isSystem: false,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      deletedAt: null,
    };

    await setDoc(docRef, insertValues);

    return {
      id: insertValues.id,
      name: insertValues.name,
      icon: insertValues.icon,
      color: insertValues.color,
      type: insertValues.type as 'expense' | 'income',
      isSystem: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  }

  public async updateCategory(
    userId: string,
    id: string,
    data: CategoryUpdate,
    tx?: any
  ): Promise<void> {
    logger.debug(`CategoryRepository: Updating category ${id} inside Firestore for user ${userId}`);
    const docRef = doc(db, 'categories', id);
    const updateValues: Record<string, any> = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (data.name !== undefined) updateValues.name = data.name.trim();
    if (data.icon !== undefined) updateValues.icon = data.icon.trim();
    if (data.color !== undefined) updateValues.color = data.color.trim();

    await updateDoc(docRef, updateValues);
  }

  public async deleteCategory(userId: string, id: string, tx?: any): Promise<void> {
    logger.debug(`CategoryRepository: Soft-deleting category ${id} inside Firestore for user ${userId}`);
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, {
      deletedAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  public async restoreCategory(userId: string, id: string, tx?: any): Promise<void> {
    logger.debug(`CategoryRepository: Restoring category ${id} inside Firestore for user ${userId}`);
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, {
      deletedAt: null,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  public async reassignExpenses(
    userId: string,
    sourceCategoryId: string,
    targetCategoryId: string,
    tx?: any
  ): Promise<void> {
    logger.debug(
      `CategoryRepository: Reassigning expenses in Firestore from ${sourceCategoryId} to ${targetCategoryId} for user ${userId}`
    );

    const q = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('categoryId', '==', sourceCategoryId)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);

    snap.forEach((docSnap) => {
      const expenseData = docSnap.data();
      if (!expenseData.deletedAt) {
        batch.update(docSnap.ref, {
          categoryId: targetCategoryId,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }
    });

    await batch.commit();
  }
}
