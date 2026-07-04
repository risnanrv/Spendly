import * as Crypto from 'expo-crypto';
import { db } from '../client';
import { categories, expenses } from '../schema';
import { eq, isNull, and } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import type { ICategoryRepository, CategoryInsert, CategoryUpdate } from './interfaces';
import type { Category } from '@/models/domain';

/**
 * CategoryRepository encapsulates category CRUD operations.
 */
export class CategoryRepository implements ICategoryRepository {
  private static cache: Category[] | null = null;

  public static clearCache(): void {
    CategoryRepository.cache = null;
  }

  /**
   * Retrieves all non-deleted categories.
   */
  public async getCategories(): Promise<Category[]> {
    if (CategoryRepository.cache !== null) {
      logger.debug('CategoryRepository: Resolving categories from in-memory cache.');
      return CategoryRepository.cache;
    }

    const results = await db
      .select()
      .from(categories)
      .where(isNull(categories.deletedAt));

    const mapped = results.map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type as 'expense' | 'income',
      isSystem: Boolean(row.isSystem),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    }));

    CategoryRepository.cache = mapped;
    return mapped;
  }

  /**
   * Retrieves a category by its ID (including soft-deleted ones).
   */
  public async getCategoryById(id: string): Promise<Category | null> {
    const results = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (results.length === 0) return null;
    const row = results[0];

    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      type: row.type as 'expense' | 'income',
      isSystem: Boolean(row.isSystem),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    };
  }

  /**
   * Inserts a new category.
   */
  public async createCategory(data: CategoryInsert, tx?: any): Promise<Category> {
    const runInTx = async (executor: any) => {
      const id = Crypto.randomUUID();
      const now = new Date();

      const insertValues = {
        id,
        name: data.name.trim(),
        icon: data.icon.trim(),
        color: data.color.trim(),
        type: data.type,
        isSystem: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      logger.debug(`CategoryRepository: Creating category ${id}`);
      await executor.insert(categories).values(insertValues);

      const createdCategory: Category = {
        id: insertValues.id,
        name: insertValues.name,
        icon: insertValues.icon,
        color: insertValues.color,
        type: insertValues.type as 'expense' | 'income',
        isSystem: false,
        createdAt: insertValues.createdAt,
        updatedAt: insertValues.updatedAt,
        deletedAt: null,
      };

      // Enqueue sync change
      try {
        const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
        await syncRepo.enqueueChange({
          table: 'categories',
          action: 'insert',
          recordId: id,
          payload: {
            id,
            name: insertValues.name,
            icon: insertValues.icon,
            color: insertValues.color,
            type: insertValues.type,
            isSystem: false,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            deletedAt: null,
          },
          priority: 'normal',
        }, executor);
      } catch (err) {
        logger.error('Failed to enqueue sync change for createCategory:', err);
      }

      return createdCategory;
    };

    const result = tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    CategoryRepository.clearCache();
    eventEmitter.emit(RepoEvents.CategoryCreated, result);

    // Notify sync service asynchronously
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}

    return result;
  }

  /**
   * Updates category attributes (name, icon, color).
   */
  public async updateCategory(id: string, data: CategoryUpdate, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      const updateValues: Record<string, any> = {
        updatedAt: now,
      };
      if (data.name !== undefined) updateValues.name = data.name.trim();
      if (data.icon !== undefined) updateValues.icon = data.icon.trim();
      if (data.color !== undefined) updateValues.color = data.color.trim();

      logger.debug(`CategoryRepository: Updating category ${id}`);
      await executor
        .update(categories)
        .set(updateValues)
        .where(eq(categories.id, id));

      const updatedRecord = await executor
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'categories',
            action: 'update',
            recordId: id,
            payload: {
              id: record.id,
              name: record.name,
              icon: record.icon,
              color: record.color,
              type: record.type,
              isSystem: Boolean(record.isSystem),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for updateCategory:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    CategoryRepository.clearCache();
    
    const updated = await this.getCategoryById(id);
    if (updated) {
      eventEmitter.emit('CategoryUpdated', updated);
    }

    // Notify sync service
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Soft deletes a category.
   */
  public async deleteCategory(id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`CategoryRepository: Soft-deleting category ${id}`);
      await executor
        .update(categories)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(categories.id, id));

      const updatedRecord = await executor
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'categories',
            action: 'update', // soft-delete treated as update for deletedAt column
            recordId: id,
            payload: {
              id: record.id,
              name: record.name,
              icon: record.icon,
              color: record.color,
              type: record.type,
              isSystem: Boolean(record.isSystem),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: record.deletedAt.toISOString(),
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for deleteCategory:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    CategoryRepository.clearCache();
    eventEmitter.emit(RepoEvents.CategoryDeleted, id);

    // Notify sync service
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Restores a soft-deleted category.
   */
  public async restoreCategory(id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`CategoryRepository: Restoring category ${id}`);
      await executor
        .update(categories)
        .set({ deletedAt: null, updatedAt: now })
        .where(eq(categories.id, id));

      const updatedRecord = await executor
        .select()
        .from(categories)
        .where(eq(categories.id, id))
        .limit(1);

      if (updatedRecord.length > 0) {
        const record = updatedRecord[0];
        try {
          const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
          await syncRepo.enqueueChange({
            table: 'categories',
            action: 'update',
            recordId: id,
            payload: {
              id: record.id,
              name: record.name,
              icon: record.icon,
              color: record.color,
              type: record.type,
              isSystem: Boolean(record.isSystem),
              createdAt: record.createdAt.toISOString(),
              updatedAt: record.updatedAt.toISOString(),
              deletedAt: null,
            },
            priority: 'normal',
          }, executor);
        } catch (err) {
          logger.error('Failed to enqueue sync change for restoreCategory:', err);
        }
      }
    };

    tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    CategoryRepository.clearCache();
    eventEmitter.emit(RepoEvents.CategoryRestored, id);

    // Notify sync service
    try {
      const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
      syncService.notify();
    } catch {}
  }

  /**
   * Reassigns all expenses from a source category to a target category.
   */
  public async reassignExpenses(sourceCategoryId: string, targetCategoryId: string, tx?: any): Promise<void> {
    const executor = tx || db;
    logger.debug(`CategoryRepository: Reassigning expenses from ${sourceCategoryId} to ${targetCategoryId}`);

    const list = await executor
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.categoryId, sourceCategoryId),
          isNull(expenses.deletedAt)
        )
      );

    await executor
      .update(expenses)
      .set({ categoryId: targetCategoryId, updatedAt: new Date() })
      .where(
        and(
          eq(expenses.categoryId, sourceCategoryId),
          isNull(expenses.deletedAt)
        )
      );

    // Enqueue sync update for each reassigned expense
    try {
      const syncRepo = require('@/di/ServiceContainer').container.resolve('ISyncRepository');
      const now = new Date();
      for (const record of list) {
        await syncRepo.enqueueChange({
          table: 'expenses',
          action: 'update',
          recordId: record.id,
          payload: {
            id: record.id,
            amount: record.amount,
            categoryId: targetCategoryId,
            title: record.title,
            note: record.note,
            date: record.date.toISOString(),
            createdAt: record.createdAt.toISOString(),
            updatedAt: now.toISOString(),
            deletedAt: null,
          },
          priority: 'normal',
        }, executor);
      }
    } catch (err) {
      logger.error('Failed to enqueue sync changes for reassigned expenses:', err);
    }
  }
}
