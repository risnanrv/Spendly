import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  deleteDoc,
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

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
      const uuid = generateUUID();
      const docRef = doc(db, 'categories', uuid);
      const categoryData = {
        id: uuid,
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

  private async migrateLegacyCategories(userId: string, categories: Category[]): Promise<Category[]> {
    logger.info(`CategoryRepository: Migrating legacy categories for user ${userId} to UUIDs`);
    const migratedList: Category[] = [];

    for (const cat of categories) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.id);
      if (isUuid) {
        migratedList.push(cat);
        continue;
      }

      // Generate new UUID
      const newUuid = generateUUID();
      logger.info(`CategoryRepository: Migrating legacy category "${cat.name}" (${cat.id} -> ${newUuid})`);

      // 1. Create new category document
      const now = new Date();
      const newRef = doc(db, 'categories', newUuid);
      await setDoc(newRef, {
        id: newUuid,
        userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        isSystem: cat.isSystem,
        createdAt: Timestamp.fromDate(cat.createdAt),
        updatedAt: Timestamp.fromDate(now),
        deletedAt: cat.deletedAt ? Timestamp.fromDate(cat.deletedAt) : null,
      });

      // 2. Query and update all expenses belonging to this category
      const expQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        where('categoryId', '==', cat.id)
      );
      const expSnap = await getDocs(expQuery);
      
      if (!expSnap.empty) {
        const expDocs = expSnap.docs;
        for (let i = 0; i < expDocs.length; i += 400) {
          const batch = writeBatch(db);
          const chunk = expDocs.slice(i, i + 400);
          chunk.forEach((expDoc) => {
            batch.update(doc(db, 'expenses', expDoc.id), {
              categoryId: newUuid,
              updatedAt: Timestamp.fromDate(now),
            });
          });
          await batch.commit();
        }
      }

      // 3. Delete old category document
      const oldRef = doc(db, 'categories', cat.id);
      await deleteDoc(oldRef);
      
      migratedList.push({
        ...cat,
        id: newUuid,
        updatedAt: now,
      });
    }

    logger.info(`CategoryRepository: Completed migrating legacy categories to UUIDs`);
    return migratedList;
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
    let needsMigration = false;

    snap.forEach((docSnap) => {
      const cat = mapDocToCategory(docSnap);
      if (!cat.deletedAt) {
        results.push(cat);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat.id);
        if (!isUuid) {
          needsMigration = true;
        }
      }
    });

    if (needsMigration) {
      return this.migrateLegacyCategories(userId, results);
    }

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
    const uuid = generateUUID();
    const docRef = doc(db, 'categories', uuid);
    const now = new Date();

    const insertValues = {
      id: uuid,
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
    
    let batch = writeBatch(db);
    let count = 0;
    const promises = [];

    for (const docSnap of snap.docs) {
      const expenseData = docSnap.data();
      if (!expenseData.deletedAt) {
        batch.update(docSnap.ref, {
          categoryId: targetCategoryId,
          updatedAt: Timestamp.fromDate(new Date()),
        });
        count++;

        if (count >= 400) {
          promises.push(batch.commit());
          batch = writeBatch(db);
          count = 0;
        }
      }
    }

    if (count > 0) {
      promises.push(batch.commit());
    }

    await Promise.all(promises);
  }
}
