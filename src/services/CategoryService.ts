import type { ICategoryRepository, IExpenseRepository } from '@/database/repositories/interfaces';
import type { Category } from '@/models/domain';
import { db } from '@/lib/db';
import { logger } from '@/utils/logger';
import { CURATED_COLORS, CURATED_ICONS } from '@/config/category-constants';

export class CategoryService {
  constructor(
    private categoryRepo: ICategoryRepository,
    private expenseRepo: IExpenseRepository
  ) {}

  public async getCategoriesWithStats(userId: string): Promise<Category[]> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    logger.debug(`CategoryService: Compiling categories spending statistics for user ${userId}`);

    // Fetch categories and active expenses in parallel
    const [allCats, allExpenses] = await Promise.all([
      this.categoryRepo.getCategories(userId),
      this.expenseRepo.getExpenses(userId, { limit: 100000 }),
    ]);

    // Aggregate expense statistics in linear time
    const statsMap = new Map<string, { count: number; total: number }>();
    allExpenses.forEach((exp) => {
      const stats = statsMap.get(exp.categoryId) || { count: 0, total: 0 };
      statsMap.set(exp.categoryId, {
        count: stats.count + 1,
        total: stats.total + exp.amount,
      });
    });

    return allCats.map((cat) => {
      const stats = statsMap.get(cat.id) || { count: 0, total: 0 };
      return {
        ...cat,
        expenseCount: stats.count,
        totalSpent: stats.total,
      };
    });
  }

  public async createCategory(
    userId: string,
    name: string,
    icon: string,
    color: string,
    type: 'expense' | 'income' = 'expense'
  ): Promise<Category> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const cleanedName = this.validateAndCleanName(name);
    this.validateIconAndColor(icon, color);

    const activeCats = await this.categoryRepo.getCategories(userId);
    const duplicate = activeCats.find((c) => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (duplicate) {
      throw new Error(`A category named "${cleanedName}" already exists.`);
    }

    return this.categoryRepo.createCategory(userId, {
      name: cleanedName,
      icon,
      color,
      type,
    });
  }

  public async updateCategory(
    userId: string,
    id: string,
    name?: string,
    icon?: string,
    color?: string
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const category = await this.categoryRepo.getCategoryById(userId, id);
    if (!category) {
      throw new Error('Category not found.');
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      const cleanedName = this.validateAndCleanName(name);
      
      const activeCats = await this.categoryRepo.getCategories(userId);
      const duplicate = activeCats.find(
        (c) => c.name.toLowerCase() === cleanedName.toLowerCase() && c.id !== id
      );
      if (duplicate) {
        throw new Error(`A category named "${cleanedName}" already exists.`);
      }

      if (category.isSystem && category.name !== cleanedName) {
        throw new Error('System category names are protected and cannot be changed.');
      }

      updates.name = cleanedName;
    }

    if (icon !== undefined) {
      this.validateIcon(icon);
      updates.icon = icon;
    }

    if (color !== undefined) {
      this.validateColor(color);
      updates.color = color;
    }

    await this.categoryRepo.updateCategory(userId, id, updates);
  }

  public async deleteCategory(userId: string, id: string, reassignToId?: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const category = await this.categoryRepo.getCategoryById(userId, id);
    if (!category) {
      throw new Error('Category not found.');
    }
    if (category.isSystem) {
      throw new Error('System categories are protected and cannot be deleted.');
    }

    const activeExpenses = await this.expenseRepo.getExpenses(userId, { categoryId: id, limit: 10 });
    const hasExpenses = activeExpenses.length > 0;

    if (hasExpenses) {
      if (!reassignToId) {
        throw new Error('Category contains transactions. Please specify a replacement category.');
      }
      if (reassignToId === id) {
        throw new Error('Replacement category must be different from the deleted category.');
      }
      const targetCategory = await this.categoryRepo.getCategoryById(userId, reassignToId);
      if (!targetCategory || targetCategory.deletedAt) {
        throw new Error('Selected replacement category is invalid or deleted.');
      }

      await db.transaction(async (tx) => {
        await this.categoryRepo.reassignExpenses(userId, id, reassignToId, tx);
        await this.categoryRepo.deleteCategory(userId, id, tx);
      });
    } else {
      await this.categoryRepo.deleteCategory(userId, id);
    }
  }

  public async restoreCategory(userId: string, id: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    const category = await this.categoryRepo.getCategoryById(userId, id);
    if (!category) {
      throw new Error('Category not found.');
    }
    await this.categoryRepo.restoreCategory(userId, id);
  }

  private validateAndCleanName(name: string): string {
    if (!name || name.trim().length === 0) {
      throw new Error('Category name is required.');
    }
    const cleaned = name.trim();
    if (cleaned.length > 30) {
      throw new Error('Category name cannot exceed 30 characters.');
    }
    return cleaned;
  }

  private validateIconAndColor(icon: string, color: string): void {
    this.validateIcon(icon);
    this.validateColor(color);
  }

  private validateIcon(icon: string): void {
    if (!CURATED_ICONS.includes(icon as any)) {
      throw new Error(`Selected icon "${icon}" is not supported.`);
    }
  }

  private validateColor(color: string): void {
    if (!CURATED_COLORS.includes(color as any)) {
      throw new Error(`Selected color token "${color}" does not match the Spendly palette.`);
    }
  }
}
