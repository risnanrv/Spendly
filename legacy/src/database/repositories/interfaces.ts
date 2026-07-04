import type { Expense, Category, MonthlyBudget } from '@/models/domain';

export interface ExpenseInsert {
  amount: number; // Stored as integer cents/paisa inside database, passed as cents/paisa as well
  categoryId: string;
  title: string;
  note?: string | undefined;
  date: Date;
}

export interface ExpenseUpdate {
  amount?: number | undefined;
  categoryId?: string | undefined;
  title?: string | undefined;
  note?: string | undefined;
  date?: Date | undefined;
}

export interface CategoryInsert {
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  color?: string;
}

export interface QueueEntryInsert {
  table: string;
  action: 'insert' | 'update' | 'delete';
  recordId: string;
  payload: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  operationVersion?: number;
}

export interface IExpenseRepository {
  createExpense(data: ExpenseInsert, tx?: any): Promise<Expense>;
  updateExpense(id: string, data: ExpenseUpdate, tx?: any): Promise<void>;
  deleteExpense(id: string, tx?: any): Promise<void>;
  restoreExpense(id: string, tx?: any): Promise<void>;
  getExpenseById(id: string): Promise<Expense | null>;
  getExpensesByMonth(monthStr: string): Promise<Expense[]>;
  searchExpenses(query: string, options?: { limit?: number; offset?: number }): Promise<Expense[]>;
  getExpenses(options?: {
    filter?: 'today' | 'week' | 'month' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
    categoryId?: string;
  }): Promise<Expense[]>;
  getCategoryTotals(monthStr: string): Promise<Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    totalAmount: number;
  }>>;
}

export interface ICategoryRepository {
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(data: CategoryInsert, tx?: any): Promise<Category>;
  updateCategory(id: string, data: CategoryUpdate, tx?: any): Promise<void>;
  deleteCategory(id: string, tx?: any): Promise<void>;
  restoreCategory(id: string, tx?: any): Promise<void>;
  reassignExpenses(sourceCategoryId: string, targetCategoryId: string, tx?: any): Promise<void>;
}

export interface IBudgetRepository {
  getCurrentBudget(monthStr: string): Promise<MonthlyBudget | null>;
  setBudget(monthStr: string, amount: number, tx?: any): Promise<MonthlyBudget>;
  deleteBudget(monthStr: string, tx?: any): Promise<void>;
}

export interface ISettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, tx?: any): Promise<void>;
}

export interface IPreferencesRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, tx?: any): Promise<void>;
}

export interface ISyncRepository {
  enqueueChange(data: QueueEntryInsert, tx?: any): Promise<any>;
  getPendingChanges(): Promise<any[]>;
  markAsProcessing(id: string, tx?: any): Promise<void>;
  markAsSynced(id: string, tx?: any): Promise<void>;
  markAsFailed(id: string, errorMsg: string, tx?: any): Promise<void>;
  markAsConflict(id: string, tx?: any): Promise<void>;
  cancel(id: string, tx?: any): Promise<void>;
  cleanup(tx?: any): Promise<void>;
  getPendingCount(): Promise<number>;
}
