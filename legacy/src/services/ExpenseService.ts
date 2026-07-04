import type { IExpenseRepository, ExpenseInsert, ExpenseUpdate } from '@/database/repositories/interfaces';
import type { Expense } from '@/models/domain';

const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * ExpenseService represents the business logic layer for expenses.
 * Contains string sanitizations and input criteria checks.
 */
export class ExpenseService {
  constructor(private expenseRepo: IExpenseRepository) {}

  /**
   * Validates and normalizes parameters, then creates an expense record.
   */
  public async createExpense(data: ExpenseInsert, tx?: any): Promise<Expense> {
    // 1. Sanitize & Normalize
    const title = (data.title || '').trim();
    const note = data.note ? data.note.trim() : undefined;
    const amount = Math.floor(data.amount); // Force integer cents

    // 2. Business Validations
    if (!title) {
      throw new Error('Expense title is required.');
    }
    if (title.length > 80) {
      throw new Error('Expense title cannot exceed 80 characters.');
    }
    if (amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    if (!data.categoryId) {
      throw new Error('Category is required.');
    }
    if (!validateUUID(data.categoryId)) {
      throw new Error('Selected category is invalid.');
    }
    if (!data.date || !(data.date instanceof Date) || isNaN(data.date.getTime())) {
      throw new Error('Valid date is required.');
    }
    if (note && note.length > 500) {
      throw new Error('Note description cannot exceed 500 characters.');
    }

    const insertData: ExpenseInsert = {
      title,
      amount,
      categoryId: data.categoryId,
      date: data.date,
    };
    if (note !== undefined) {
      insertData.note = note;
    }

    return this.expenseRepo.createExpense(insertData, tx);
  }

  /**
   * Validates parameters, then updates an expense record.
   */
  public async updateExpense(
    id: string,
    data: ExpenseUpdate,
    tx?: any
  ): Promise<void> {
    if (!validateUUID(id)) {
      throw new Error('Invalid expense identifier.');
    }

    const title = data.title !== undefined ? data.title.trim() : undefined;
    const note = data.note !== undefined ? (data.note ? data.note.trim() : '') : undefined;
    const amount = data.amount !== undefined ? Math.floor(data.amount) : undefined;

    // Business validations on present updates
    if (title !== undefined) {
      if (!title) throw new Error('Expense title is required.');
      if (title.length > 80) throw new Error('Expense title cannot exceed 80 characters.');
    }
    if (amount !== undefined && amount <= 0) {
      throw new Error('Expense amount must be greater than zero.');
    }
    if (data.categoryId !== undefined) {
      if (!data.categoryId) throw new Error('Category is required.');
      if (!validateUUID(data.categoryId)) throw new Error('Selected category is invalid.');
    }
    if (data.date !== undefined) {
      if (!data.date || !(data.date instanceof Date) || isNaN(data.date.getTime())) {
        throw new Error('Valid date is required.');
      }
    }
    if (note !== undefined && note && note.length > 500) {
      throw new Error('Note description cannot exceed 500 characters.');
    }

    const updateData: ExpenseUpdate = {};
    if (title !== undefined) updateData.title = title;
    if (note !== undefined) updateData.note = note;
    if (amount !== undefined) updateData.amount = amount;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.date !== undefined) updateData.date = data.date;

    return this.expenseRepo.updateExpense(id, updateData, tx);
  }

  /**
   * Soft deletes an expense.
   */
  public async deleteExpense(id: string, tx?: any): Promise<void> {
    if (!validateUUID(id)) {
      throw new Error('Invalid expense identifier.');
    }
    return this.expenseRepo.deleteExpense(id, tx);
  }

  /**
   * Restores a soft-deleted expense.
   */
  public async restoreExpense(id: string, tx?: any): Promise<void> {
    if (!validateUUID(id)) {
      throw new Error('Invalid expense identifier.');
    }
    return this.expenseRepo.restoreExpense(id, tx);
  }
}
