import type { ICategoryRepository, IExpenseRepository } from '@/database/repositories/interfaces';
import type { Category } from '@/models/domain';
import { db } from '@/database/client';
import { logger } from '@/utils/logger';

// Curated Spendly design system color tokens
export const CURATED_COLORS = [
  'indigo',     // brandPrimary
  'orange',
  'blue',
  'purple',
  'red',
  'pink',
  'emerald',    // green
  'violet',
  'cyan',
  'amber',
  'slate',
  'rose',
  'teal',
  'yellow',
  'lightBlue',
  'gray',
] as const;

// Curated Lucide icons list for Category Pickers
export const CURATED_ICONS = [
  'utensils',       // Food
  'car',            // Transport
  'shopping-bag',   // Shopping
  'receipt',        // Bills
  'film',           // Entertainment
  'heart-pulse',    // Healthcare
  'graduation-cap', // Education
  'plane',          // Travel
  'credit-card',    // Subscriptions
  'grid',           // Other
  'briefcase',      // Salary
  'home',           // Rent
  'shirt',          // Clothing
  'gift',           // Gifts
  'dumbbell',       // Fitness
  'coffee',         // Café
  'book',           // Books
  'gamepad-2',      // Gaming
  'laptop',         // Tech
  'paw-print',      // Pets
  'wrench',         // Repairs/Maintenance
  'music',          // Music
  'tv',             // Cable/TV
  'sparkles',       // Beauty/Salons
] as const;

export class CategoryService {
  constructor(
    private categoryRepo: ICategoryRepository,
    private expenseRepo: IExpenseRepository
  ) {}

  /**
   * Fetches all active categories aggregated with all-time expenses count and spending sums.
   */
  public async getCategoriesWithStats(): Promise<Category[]> {
    logger.debug('CategoryService: Compiling categories spending statistics');

    // Fetch categories and active expenses in parallel
    const [allCats, allExpenses] = await Promise.all([
      this.categoryRepo.getCategories(),
      this.expenseRepo.getExpenses({ limit: 100000 }), // Safe limit for local DB fetch
    ]);

    // Aggregate expense statistics in O(N) linear time
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

  /**
   * Validates name checks, detects duplicates, verifies colors, and saves new Category.
   */
  public async createCategory(name: string, icon: string, color: string, type: 'expense' | 'income' = 'expense'): Promise<Category> {
    const cleanedName = this.validateAndCleanName(name);
    this.validateIconAndColor(icon, color);

    // Case-insensitive duplicate name check
    const activeCats = await this.categoryRepo.getCategories();
    const duplicate = activeCats.find((c) => c.name.toLowerCase() === cleanedName.toLowerCase());
    if (duplicate) {
      throw new Error(`A category named "${cleanedName}" already exists.`);
    }

    return this.categoryRepo.createCategory({
      name: cleanedName,
      icon,
      color,
      type,
    });
  }

  /**
   * Updates attributes of an existing custom/system category.
   */
  public async updateCategory(id: string, name?: string, icon?: string, color?: string): Promise<void> {
    const category = await this.categoryRepo.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found.');
    }

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      const cleanedName = this.validateAndCleanName(name);
      
      // Prevent renaming to duplicates (excluding self)
      const activeCats = await this.categoryRepo.getCategories();
      const duplicate = activeCats.find(
        (c) => c.name.toLowerCase() === cleanedName.toLowerCase() && c.id !== id
      );
      if (duplicate) {
        throw new Error(`A category named "${cleanedName}" already exists.`);
      }

      // If system category, enforce name lock rule (optional but recommended)
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

    await this.categoryRepo.updateCategory(id, updates);
  }

  /**
   * Soft deletes a custom category. Enforces reassignment transactions if active expenses exist.
   */
  public async deleteCategory(id: string, reassignToId?: string): Promise<void> {
    const category = await this.categoryRepo.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found.');
    }
    if (category.isSystem) {
      throw new Error('System categories are protected and cannot be deleted.');
    }

    // Check if active expenses belong to this category
    const activeExpenses = await this.expenseRepo.getExpenses({ categoryId: id, limit: 10 });
    const hasExpenses = activeExpenses.length > 0;

    if (hasExpenses) {
      if (!reassignToId) {
        throw new Error('Category contains transactions. Please specify a replacement category.');
      }
      if (reassignToId === id) {
        throw new Error('Replacement category must be different from the deleted category.');
      }
      const targetCategory = await this.categoryRepo.getCategoryById(reassignToId);
      if (!targetCategory || targetCategory.deletedAt) {
        throw new Error('Selected replacement category is invalid or deleted.');
      }

      // Migrate expenses and delete in a single SQLite transaction block
      logger.info(`CategoryService: Executing category reassignment migration from ${id} to ${reassignToId}`);
      await db.transaction(async (tx) => {
        await this.categoryRepo.reassignExpenses(id, reassignToId, tx);
        await this.categoryRepo.deleteCategory(id, tx);
      });
    } else {
      await this.categoryRepo.deleteCategory(id);
    }
  }

  /**
   * Restores a deleted custom category.
   */
  public async restoreCategory(id: string): Promise<void> {
    const category = await this.categoryRepo.getCategoryById(id);
    if (!category) {
      throw new Error('Category not found.');
    }
    await this.categoryRepo.restoreCategory(id);
  }

  // Helper sanitization rules
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
      throw new Error(`Selected icon "${icon}" is not supported inside the design system list.`);
    }
  }

  private validateColor(color: string): void {
    if (!CURATED_COLORS.includes(color as any)) {
      throw new Error(`Selected color token "${color}" does not match the Spendly color palette.`);
    }
  }
}
