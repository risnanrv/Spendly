import crypto from 'crypto';
import { db } from '../../lib/db';
import { categories, expenses } from '../schema';
import { eq, isNull, and, or } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { ICategoryRepository, CategoryInsert, CategoryUpdate } from './interfaces';
import type { Category } from '@/models/domain';

export class CategoryRepository implements ICategoryRepository {
  private static cache: Map<string, Category[]> = new Map();

  public static clearCache(userId?: string): void {
    if (userId) {
      CategoryRepository.cache.delete(userId);
    } else {
      CategoryRepository.cache.clear();
    }
  }

  public async getCategories(userId: string): Promise<Category[]> {
    const cached = CategoryRepository.cache.get(userId);
    if (cached) {
      logger.debug(`CategoryRepository: Resolving categories from cache for user ${userId}`);
      return cached;
    }

    const results = await db
      .select()
      .from(categories)
      .where(
        and(
          isNull(categories.deletedAt),
          or(
            eq(categories.userId, userId),
            isNull(categories.userId)
          )
        )
      );

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

    CategoryRepository.cache.set(userId, mapped);
    return mapped;
  }

  public async getCategoryById(userId: string, id: string): Promise<Category | null> {
    const results = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, id),
          or(
            eq(categories.userId, userId),
            isNull(categories.userId)
          )
        )
      )
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

  public async createCategory(
    userId: string,
    data: CategoryInsert,
    tx?: any
  ): Promise<Category> {
    const runInTx = async (executor: any) => {
      const id = crypto.randomUUID();
      const now = new Date();

      const insertValues = {
        id,
        userId,
        name: data.name.trim(),
        icon: data.icon.trim(),
        color: data.color.trim(),
        type: data.type,
        isSystem: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      logger.debug(`CategoryRepository: Creating category ${id} for user ${userId}`);
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

      return createdCategory;
    };

    const result = tx ? await runInTx(tx) : await db.transaction(async (innerTx) => runInTx(innerTx));
    CategoryRepository.clearCache(userId);
    return result;
  }

  public async updateCategory(
    userId: string,
    id: string,
    data: CategoryUpdate,
    tx?: any
  ): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      const updateValues: Record<string, any> = {
        updatedAt: now,
      };
      if (data.name !== undefined) updateValues.name = data.name.trim();
      if (data.icon !== undefined) updateValues.icon = data.icon.trim();
      if (data.color !== undefined) updateValues.color = data.color.trim();

      logger.debug(`CategoryRepository: Updating category ${id} for user ${userId}`);
      await executor
        .update(categories)
        .set(updateValues)
        .where(
          and(
            eq(categories.id, id),
            eq(categories.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
    CategoryRepository.clearCache(userId);
  }

  public async deleteCategory(userId: string, id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`CategoryRepository: Soft-deleting category ${id} for user ${userId}`);
      await executor
        .update(categories)
        .set({ deletedAt: now, updatedAt: now })
        .where(
          and(
            eq(categories.id, id),
            eq(categories.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
    CategoryRepository.clearCache(userId);
  }

  public async restoreCategory(userId: string, id: string, tx?: any): Promise<void> {
    const runInTx = async (executor: any) => {
      const now = new Date();
      logger.debug(`CategoryRepository: Restoring category ${id} for user ${userId}`);
      await executor
        .update(categories)
        .set({ deletedAt: null, updatedAt: now })
        .where(
          and(
            eq(categories.id, id),
            eq(categories.userId, userId)
          )
        );
    };

    await (tx ? runInTx(tx) : db.transaction(async (innerTx) => runInTx(innerTx)));
    CategoryRepository.clearCache(userId);
  }

  public async reassignExpenses(
    userId: string,
    sourceCategoryId: string,
    targetCategoryId: string,
    tx?: any
  ): Promise<void> {
    const executor = tx || db;
    logger.debug(`CategoryRepository: Reassigning expenses from ${sourceCategoryId} to ${targetCategoryId} for user ${userId}`);

    await executor
      .update(expenses)
      .set({ categoryId: targetCategoryId, updatedAt: new Date() })
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.categoryId, sourceCategoryId),
          isNull(expenses.deletedAt)
        )
      );
  }
}
