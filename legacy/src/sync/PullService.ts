import { db } from '@/database/client';
import { expenses, categories, monthlyBudgets, settings } from '@/database/schema';
import { apiClient } from '@/lib/api-client';
import { eq } from 'drizzle-orm';
import { SyncLogger } from './SyncLogger';
import { ConflictResolver } from './ConflictResolver';
import { eventEmitter, RepoEvents } from '@/utils/event-emitter';
import { CategoryRepository } from '@/database/repositories/CategoryRepository';
import { secureStorage, StorageKeys } from '@/utils/storage';
import type { PullRequest, PullResponse } from './SyncTypes';

/**
 * PullService downloads incremental updates from the cloud, resolves version/timestamp
 * conflicts using ConflictResolver, merges updates into SQLite, and ensures cache integrity.
 */
export class PullService {
  /**
   * Pulls incremental cloud changes and merges them locally.
   */
  public async pull(): Promise<void> {
    SyncLogger.debug('PullService: Initiating cloud updates pull...');

    // Fetch the last synchronization timestamp from secure storage
    const lastSyncAt = await secureStorage.get(StorageKeys.LAST_SYNCS_TIMESTAMP) || null;
    SyncLogger.info(`PullService: Incremental sync checkpoint is set to: ${lastSyncAt || 'Initial Sync'}`);

    const requestPayload: PullRequest = { lastSyncAt };

    try {
      const response = await apiClient.post<PullResponse>('/sync/pull', requestPayload);
      const { changes, syncTimestamp } = response.data;

      SyncLogger.info(`PullService: Received ${changes.length} incremental changes from cloud.`);

      if (changes.length > 0) {
        // Apply changes in a database transaction block
        await db.transaction(async (tx) => {
          for (const change of changes) {
            const table = change.table;
            const recordId = change.recordId;
            const remotePayload = change.payload;

            SyncLogger.debug(`PullService: Syncing remote change for record ${recordId} in table ${table}`);

            if (table === 'expenses') {
              const localResult = await tx
                .select()
                .from(expenses)
                .where(eq(expenses.id, recordId))
                .limit(1);
              
              const local = localResult[0] || null;
              const { strategy, payload } = ConflictResolver.resolve('expenses', local, remotePayload);

              if (!local) {
                // Insert new expense
                await tx.insert(expenses).values({
                  id: recordId,
                  amount: payload.amount,
                  categoryId: payload.categoryId,
                  title: payload.title,
                  note: payload.note,
                  date: new Date(payload.date),
                  createdAt: new Date(payload.createdAt),
                  updatedAt: new Date(payload.updatedAt),
                  deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                });
              } else if (strategy === 'remote_wins' || strategy === 'merge') {
                // Update local expense
                await tx
                  .update(expenses)
                  .set({
                    amount: payload.amount,
                    categoryId: payload.categoryId,
                    title: payload.title,
                    note: payload.note,
                    date: new Date(payload.date),
                    updatedAt: new Date(payload.updatedAt),
                    deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                  })
                  .where(eq(expenses.id, recordId));
              }
            } else if (table === 'categories') {
              const localResult = await tx
                .select()
                .from(categories)
                .where(eq(categories.id, recordId))
                .limit(1);

              const local = localResult[0] || null;
              const { strategy, payload } = ConflictResolver.resolve('categories', local, remotePayload);

              if (!local) {
                await tx.insert(categories).values({
                  id: recordId,
                  name: payload.name,
                  icon: payload.icon,
                  color: payload.color,
                  type: payload.type,
                  isSystem: Boolean(payload.isSystem),
                  createdAt: new Date(payload.createdAt),
                  updatedAt: new Date(payload.updatedAt),
                  deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                });
              } else if (strategy === 'remote_wins' || strategy === 'merge') {
                await tx
                  .update(categories)
                  .set({
                    name: payload.name,
                    icon: payload.icon,
                    color: payload.color,
                    type: payload.type,
                    isSystem: Boolean(payload.isSystem),
                    updatedAt: new Date(payload.updatedAt),
                    deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                  })
                  .where(eq(categories.id, recordId));
              }
            } else if (table === 'budgets') {
              const localResult = await tx
                .select()
                .from(monthlyBudgets)
                .where(eq(monthlyBudgets.id, recordId))
                .limit(1);

              const local = localResult[0] || null;
              const { strategy, payload } = ConflictResolver.resolve('budgets', local, remotePayload);

              if (!local) {
                await tx.insert(monthlyBudgets).values({
                  id: recordId,
                  month: payload.month,
                  amount: payload.amount,
                  createdAt: new Date(payload.createdAt),
                  updatedAt: new Date(payload.updatedAt),
                  deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                });
              } else if (strategy === 'remote_wins' || strategy === 'merge') {
                await tx
                  .update(monthlyBudgets)
                  .set({
                    month: payload.month,
                    amount: payload.amount,
                    updatedAt: new Date(payload.updatedAt),
                    deletedAt: payload.deletedAt ? new Date(payload.deletedAt) : null,
                  })
                  .where(eq(monthlyBudgets.id, recordId));
              }
            } else if (table === 'settings') {
              const localResult = await tx
                .select()
                .from(settings)
                .where(eq(settings.key, recordId))
                .limit(1);

              const local = localResult[0] || null;
              const { strategy, payload } = ConflictResolver.resolve('settings', local, remotePayload);

              if (!local) {
                await tx.insert(settings).values({
                  key: recordId,
                  value: payload.value,
                  createdAt: new Date(payload.createdAt),
                  updatedAt: new Date(payload.updatedAt),
                });
              } else if (strategy === 'remote_wins' || strategy === 'merge') {
                await tx
                  .update(settings)
                  .set({
                    value: payload.value,
                    updatedAt: new Date(payload.updatedAt),
                  })
                  .where(eq(settings.key, recordId));
              }
            }
          }
        });

        // Purge local static caches and notify UI triggers
        CategoryRepository.clearCache();
        
        // Dispatch notifications to trigger React Query invalidations
        eventEmitter.emit(RepoEvents.ExpenseCreated, {});
        eventEmitter.emit(RepoEvents.CategoryCreated, {});
        eventEmitter.emit(RepoEvents.BudgetSet, {});
      }

      // Record sync checkpoint timestamp
      await secureStorage.set(StorageKeys.LAST_SYNCS_TIMESTAMP, syncTimestamp);
      SyncLogger.info(`PullService: Incremental pull complete. Checkpoint updated to ${syncTimestamp}`);
    } catch (error) {
      SyncLogger.error('PullService: Cloud updates pull failed', error);
      throw error;
    }
  }
}
