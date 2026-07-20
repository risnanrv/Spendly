import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { logger } from '@/utils/logger';

export interface BackupPayload {
  app: 'Spendly';
  backupVersion: number;
  exportedAt: string;
  data: {
    expenses: any[];
    categories: any[];
    monthlyBudgets: any[];
    settings: any[];
    userPreferences: any[];
  };
}

export class BackupService {
  /**
   * Compiles Firestore collection documents for a specific user and returns a BackupPayload object.
   */
  public async getBackupData(userId: string): Promise<BackupPayload> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    logger.info(`BackupService: Executing Firestore snapshot extraction for user ${userId}...`);

    try {
      const expensesQuery = query(collection(db, 'expenses'), where('userId', '==', userId));
      const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));
      const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', userId));
      const settingsDocRef = doc(db, 'settings', userId);

      const [expensesSnap, categoriesSnap, budgetsSnap, settingsSnap] = await Promise.all([
        getDocs(expensesQuery),
        getDocs(categoriesQuery),
        getDocs(budgetsQuery),
        getDoc(settingsDocRef),
      ]);

      const expensesList: any[] = [];
      expensesSnap.forEach((d) => {
        const data = d.data();
        expensesList.push({
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate().toISOString() : data.deletedAt,
        });
      });

      const categoriesList: any[] = [];
      categoriesSnap.forEach((d) => {
        const data = d.data();
        categoriesList.push({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate().toISOString() : data.deletedAt,
        });
      });

      const budgetsList: any[] = [];
      budgetsSnap.forEach((d) => {
        const data = d.data();
        budgetsList.push({
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          deletedAt: data.deletedAt instanceof Timestamp ? data.deletedAt.toDate().toISOString() : data.deletedAt,
        });
      });

      const settingsList: any[] = [];
      const preferencesList: any[] = [];
      if (settingsSnap.exists()) {
        const settingsData = settingsSnap.data();
        Object.entries(settingsData).forEach(([key, value]) => {
          if (key === 'userId' || key === 'updatedAt') return;
          
          const record = {
            key,
            value,
            createdAt: settingsData.createdAt instanceof Timestamp ? settingsData.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: settingsData.updatedAt instanceof Timestamp ? settingsData.updatedAt.toDate().toISOString() : new Date().toISOString(),
          };

          if (key.startsWith('preferences_')) {
            preferencesList.push(record);
          } else {
            settingsList.push(record);
          }
        });
      }

      return {
        app: 'Spendly',
        backupVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {
          expenses: expensesList,
          categories: categoriesList,
          monthlyBudgets: budgetsList,
          settings: settingsList,
          userPreferences: preferencesList,
        },
      };
    } catch (error) {
      logger.error(`BackupService: Export backup data compile failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Imports backup JSON contents, maps them to the active user, and overrides the user's Firestore data.
   */
  public async restoreBackup(userId: string, backup: BackupPayload): Promise<boolean> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    logger.info(`BackupService: Committing Firestore merge writes transaction for user ${userId}...`);

    try {
      if (!backup || backup.app !== 'Spendly') {
        throw new Error('Selected backup file is invalid. Missing app identifier.');
      }
      if (backup.backupVersion !== 1) {
        throw new Error(`Incompatible backup version: ${backup.backupVersion}. Spendly expects version 1.`);
      }
      if (!backup.data) {
        throw new Error('Selected backup file is corrupt. Missing data details block.');
      }

      const { expenses, categories, monthlyBudgets: budgets, settings, userPreferences } = backup.data;
      if (!Array.isArray(expenses) || !Array.isArray(categories) || !Array.isArray(budgets)) {
        throw new Error('Invalid schema definition elements in data blocks.');
      }

      // Step 1: Query existing user data in Firestore for merging
      const [expensesSnap, categoriesSnap, budgetsSnap, settingsSnap] = await Promise.all([
        getDocs(query(collection(db, 'expenses'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'categories'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'budgets'), where('userId', '==', userId))),
        getDoc(doc(db, 'settings', userId)),
      ]);

      const existingExpenseIds = new Set<string>();
      expensesSnap.forEach((d) => existingExpenseIds.add(d.id));

      const existingBudgetIds = new Set<string>();
      budgetsSnap.forEach((d) => existingBudgetIds.add(d.id));

      const nameToExistingCatId = new Map<string, string>(); // lowercase name -> category id
      const existingCatIds = new Set<string>();
      categoriesSnap.forEach((d) => {
        const catData = d.data();
        if (!catData.deletedAt) {
          nameToExistingCatId.set(catData.name.toLowerCase().trim(), d.id);
        }
        existingCatIds.add(d.id);
      });

      // Step 2: Insert restored data in batches of 400 to avoid Firestore limits
      const now = new Date();
      let writeBatchInstance = writeBatch(db);
      let opCount = 0;

      const commitAndResetBatch = async () => {
        if (opCount > 0) {
          await writeBatchInstance.commit();
          writeBatchInstance = writeBatch(db);
          opCount = 0;
        }
      };

      const categoryIdMap = new Map<string, string>(); // backup category id -> actual category id

      // Merge Categories
      for (const c of categories) {
        const cleanedName = c.name.trim();
        const lowerName = cleanedName.toLowerCase();

        if (nameToExistingCatId.has(lowerName)) {
          // Reuse existing category
          categoryIdMap.set(c.id, nameToExistingCatId.get(lowerName)!);
        } else {
          // If ID already exists but name is different, generate new ID
          let targetId = c.id;
          if (existingCatIds.has(c.id)) {
            targetId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
              const r = (Math.random() * 16) | 0;
              const v = ch === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
          }

          const docRef = doc(db, 'categories', targetId);
          writeBatchInstance.set(docRef, {
            id: targetId,
            userId,
            name: cleanedName,
            icon: c.icon,
            color: c.color,
            type: c.type || 'expense',
            isSystem: Boolean(c.isSystem),
            createdAt: c.createdAt ? Timestamp.fromDate(new Date(c.createdAt)) : Timestamp.fromDate(now),
            updatedAt: c.updatedAt ? Timestamp.fromDate(new Date(c.updatedAt)) : Timestamp.fromDate(now),
            deletedAt: c.deletedAt ? Timestamp.fromDate(new Date(c.deletedAt)) : null,
          });

          opCount++;
          if (opCount >= 400) await commitAndResetBatch();

          categoryIdMap.set(c.id, targetId);
          nameToExistingCatId.set(lowerName, targetId);
          existingCatIds.add(targetId);
        }
      }

      // Merge Expenses
      for (const e of expenses) {
        if (existingExpenseIds.has(e.id)) {
          continue; // Skip existing expense
        }

        const actualCategoryId = categoryIdMap.get(e.categoryId) || e.categoryId;
        const docRef = doc(db, 'expenses', e.id);
        writeBatchInstance.set(docRef, {
          id: e.id,
          userId,
          amount: e.amount,
          categoryId: actualCategoryId,
          title: e.title,
          note: e.note || null,
          date: e.date ? Timestamp.fromDate(new Date(e.date)) : Timestamp.fromDate(now),
          createdAt: e.createdAt ? Timestamp.fromDate(new Date(e.createdAt)) : Timestamp.fromDate(now),
          updatedAt: e.updatedAt ? Timestamp.fromDate(new Date(e.updatedAt)) : Timestamp.fromDate(now),
          deletedAt: e.deletedAt ? Timestamp.fromDate(new Date(e.deletedAt)) : null,
        });

        opCount++;
        if (opCount >= 400) await commitAndResetBatch();
      }

      // Merge Budgets
      for (const b of budgets) {
        const budgetId = b.id || `${userId}_${b.month}`;
        if (existingBudgetIds.has(budgetId)) {
          continue; // Skip existing budget
        }

        const docRef = doc(db, 'budgets', budgetId);
        writeBatchInstance.set(docRef, {
          id: budgetId,
          userId,
          month: b.month,
          amount: b.amount,
          createdAt: b.createdAt ? Timestamp.fromDate(new Date(b.createdAt)) : Timestamp.fromDate(now),
          updatedAt: b.updatedAt ? Timestamp.fromDate(new Date(b.updatedAt)) : Timestamp.fromDate(now),
          deletedAt: b.deletedAt ? Timestamp.fromDate(new Date(b.deletedAt)) : null,
        });

        opCount++;
        if (opCount >= 400) await commitAndResetBatch();
      }

      // Commit remaining batch writes
      await commitAndResetBatch();

      // Merge Settings & Preferences (Merge safely without deletion)
      const settingsDocRef = doc(db, 'settings', userId);
      const existingSettings = settingsSnap.exists() ? settingsSnap.data() : {};

      const restoredSettings: Record<string, any> = {
        ...existingSettings,
        userId,
        updatedAt: Timestamp.fromDate(now),
      };

      if (Array.isArray(settings)) {
        settings.forEach((s) => {
          restoredSettings[s.key] = s.value;
        });
      }
      if (Array.isArray(userPreferences)) {
        userPreferences.forEach((p) => {
          restoredSettings[p.key] = p.value;
        });
      }

      await setDoc(settingsDocRef, restoredSettings);

      logger.info(`BackupService: Firestore data merged successfully for user ${userId}.`);
      return true;
    } catch (err: any) {
      logger.error(`BackupService: Merge backup failed for user ${userId}:`, err);
      throw new Error(`Data merge failed: ${err.message || err}`);
    }
  }
}
