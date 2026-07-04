import * as Crypto from 'expo-crypto';
import { db } from '../client';
import { syncQueue } from '../schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/utils/logger';
import type { ISyncRepository, QueueEntryInsert } from './interfaces';

/**
 * SyncRepository manages the outgoing sync outbox queue (SyncQueue).
 * Used to accumulate mutations applied offline so they can be synced later.
 */
export class SyncRepository implements ISyncRepository {
  /**
   * Enqueues an offline mutation change.
   */
  public async enqueueChange(
    data: QueueEntryInsert,
    tx?: any
  ): Promise<any> {
    const executor = tx || db;
    const id = Crypto.randomUUID();
    const now = new Date();

    const insertValues = {
      id,
      table: data.table,
      action: data.action,
      recordId: data.recordId,
      payload: JSON.stringify(data.payload),
      status: 'pending',
      attempts: 0,
      retryCount: 0,
      syncedAt: null,
      lastAttempt: null,
      lastError: null,
      priority: data.priority || 'normal',
      operationVersion: data.operationVersion || 1,
      createdAt: now,
      updatedAt: now,
    };

    logger.debug(`SyncRepository: Enqueuing change on table ${data.table} for record ${data.recordId}`);
    await executor.insert(syncQueue).values(insertValues);
    return insertValues;
  }

  /**
   * Retrieves pending mutations queued for transmission.
   */
  public async getPendingChanges(): Promise<any[]> {
    const results = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'pending'));

    // Sort in memory: high priority first, then normal, then low, and within each by createdAt ascending.
    const priorityWeights = { high: 0, normal: 1, low: 2 };
    return results.sort((a, b) => {
      const weightA = priorityWeights[a.priority as 'high' | 'normal' | 'low'] ?? 1;
      const weightB = priorityWeights[b.priority as 'high' | 'normal' | 'low'] ?? 1;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Sets status of queue item to processing.
   */
  public async markAsProcessing(id: string, tx?: any): Promise<void> {
    const executor = tx || db;
    await executor
      .update(syncQueue)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(syncQueue.id, id));
  }

  /**
   * Sets status to synced.
   */
  public async markAsSynced(id: string, tx?: any): Promise<void> {
    const executor = tx || db;
    const now = new Date();
    await executor
      .update(syncQueue)
      .set({ status: 'synced', syncedAt: now, updatedAt: now })
      .where(eq(syncQueue.id, id));
  }

  /**
   * Marks a queue item sync step as failed and increments attempts and retryCount.
   */
  public async markAsFailed(
    id: string,
    errorMsg: string,
    tx?: any
  ): Promise<void> {
    const executor = tx || db;
    const now = new Date();

    const entry = await executor
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.id, id))
      .limit(1);

    if (entry.length > 0) {
      const nextAttempts = entry[0].attempts + 1;
      const nextRetryCount = entry[0].retryCount + 1;
      await executor
        .update(syncQueue)
        .set({
          status: 'failed',
          attempts: nextAttempts,
          retryCount: nextRetryCount,
          lastError: errorMsg,
          lastAttempt: now,
          updatedAt: now,
        })
        .where(eq(syncQueue.id, id));
    }
  }

  /**
   * Marks a queue item status to conflict.
   */
  public async markAsConflict(id: string, tx?: any): Promise<void> {
    const executor = tx || db;
    await executor
      .update(syncQueue)
      .set({ status: 'conflict', updatedAt: new Date() })
      .where(eq(syncQueue.id, id));
  }

  /**
   * Cancels a queue item by marking it failed/cancelled.
   */
  public async cancel(id: string, tx?: any): Promise<void> {
    const executor = tx || db;
    await executor
      .update(syncQueue)
      .set({ status: 'failed', lastError: 'Cancelled by user', updatedAt: new Date() })
      .where(eq(syncQueue.id, id));
  }

  /**
   * Cleans up synced entries older than 30 days.
   */
  public async cleanup(tx?: any): Promise<void> {
    const executor = tx || db;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete synced records where syncedAt is older than 30 days ago
    // In Drizzle SQLite we can use lte or lte on syncedAt.
    // Wait, let's import lte if not present, or write it directly.
    const { lte, and } = require('drizzle-orm');
    await executor
      .delete(syncQueue)
      .where(
        and(
          eq(syncQueue.status, 'synced'),
          lte(syncQueue.syncedAt, thirtyDaysAgo)
        )
      );
  }

  /**
   * Gets pending operation count.
   */
  public async getPendingCount(): Promise<number> {
    const results = await db
      .select()
      .from(syncQueue)
      .where(eq(syncQueue.status, 'pending'));
    return results.length;
  }
}
