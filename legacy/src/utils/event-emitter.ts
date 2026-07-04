import { logger } from './logger';

type Listener = (...args: any[]) => void;

/**
 * A lightweight, in-memory event emitter for decoupling components and publishing
 * generic repository lifecycle events (e.g. ExpenseCreated, CategoryCreated).
 */
class EventEmitter {
  private events = new Map<string, Listener[]>();

  public on(event: string, listener: Listener): () => void {
    const list = this.events.get(event) || [];
    list.push(listener);
    this.events.set(event, list);
    return () => this.off(event, listener);
  }

  public off(event: string, listener: Listener): void {
    const list = this.events.get(event) || [];
    const index = list.indexOf(listener);
    if (index !== -1) {
      list.splice(index, 1);
    }
    this.events.set(event, list);
  }

  public emit(event: string, ...args: any[]): void {
    const list = this.events.get(event) || [];
    logger.debug(`[EVENT EMIT] ${event} with ${args.length} arguments.`);
    list.forEach((listener) => {
      try {
        listener(...args);
      } catch (error) {
        logger.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

export const eventEmitter = new EventEmitter();
export type { Listener };
export const RepoEvents = {
  ExpenseCreated: 'ExpenseCreated',
  ExpenseUpdated: 'ExpenseUpdated',
  ExpenseDeleted: 'ExpenseDeleted',
  ExpenseRestored: 'ExpenseRestored',
  CategoryCreated: 'CategoryCreated',
  CategoryDeleted: 'CategoryDeleted',
  CategoryRestored: 'CategoryRestored',
  BudgetSet: 'BudgetSet',
  BudgetDeleted: 'BudgetDeleted',
} as const;
