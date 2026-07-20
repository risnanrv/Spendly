import type { IExpenseRepository, ExpenseInsert, ExpenseUpdate } from '@/database/repositories/interfaces';
import type { Expense } from '@/models/domain';

const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export class ExpenseService {
  constructor(private expenseRepo: IExpenseRepository) {}

  public async createExpense(userId: string, data: ExpenseInsert, tx?: any): Promise<Expense> {
    const title = data.title?.trim() ? data.title.trim() : null;
    const note = data.note?.trim() ? data.note.trim() : null;
    const amount = Math.floor(data.amount); // Force integer cents

    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (title && title.length > 80) {
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
      note,
    };

    return this.expenseRepo.createExpense(userId, insertData, tx);
  }

  public async updateExpense(
    userId: string,
    id: string,
    data: ExpenseUpdate,
    tx?: any
  ): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid expense identifier.');
    }

    const title = data.title !== undefined ? (data.title?.trim() ? data.title.trim() : null) : undefined;
    const note = data.note !== undefined ? (data.note?.trim() ? data.note.trim() : null) : undefined;
    const amount = data.amount !== undefined ? Math.floor(data.amount) : undefined;

    if (title !== undefined && title !== null) {
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

    return this.expenseRepo.updateExpense(userId, id, updateData, tx);
  }

  public async deleteExpense(userId: string, id: string, tx?: any): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid expense identifier.');
    }
    return this.expenseRepo.deleteExpense(userId, id, tx);
  }

  public async restoreExpense(userId: string, id: string, tx?: any): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid expense identifier.');
    }
    return this.expenseRepo.restoreExpense(userId, id, tx);
  }
}
