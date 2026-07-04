import { apiClient } from '@/lib/api-client';
import { SyncLogger } from './SyncLogger';
import { RetryManager } from './RetryManager';
import type { ISyncRepository } from '@/database/repositories/interfaces';
import type { PushBatchRequest, PushBatchResponse } from './SyncTypes';

/**
 * PushService extracts pending outbox mutations from SQLite, compiles them into
 * unified payload batches, pushes them to the cloud sync API, and tracks queue results.
 */
export class PushService {
  constructor(private syncRepo: ISyncRepository) {}

  /**
   * Processes the outbox sync queue by pushing pending records to the cloud.
   */
  public async push(): Promise<void> {
    SyncLogger.debug('PushService: Initializing outbox queue processing...');

    const pending = await this.syncRepo.getPendingChanges();
    if (pending.length === 0) {
      SyncLogger.debug('PushService: Outbox is empty. No pending changes to push.');
      return;
    }

    SyncLogger.info(`PushService: Discovered ${pending.length} pending operations in outbox.`);

    // Filter items ready for processing based on exponential backoff wait times
    const itemsToProcess = pending.filter((item) => {
      const retryCount = Number(item.retryCount || 0);
      const lastAttempt = item.lastAttempt ? new Date(item.lastAttempt) : null;
      
      return RetryManager.shouldRetry(retryCount, lastAttempt);
    });

    if (itemsToProcess.length === 0) {
      SyncLogger.info('PushService: All pending items are currently in backoff quarantine.');
      return;
    }

    SyncLogger.info(`PushService: Proceeding with batch processing of ${itemsToProcess.length} items.`);

    // Batch items in groups of 20 to prevent overwhelming payloads
    const batchSize = 20;
    for (let i = 0; i < itemsToProcess.length; i += batchSize) {
      const slice = itemsToProcess.slice(i, i + batchSize);
      
      // Mark all slice items as processing
      await Promise.all(slice.map((item) => this.syncRepo.markAsProcessing(item.id)));

      const requestPayload: PushBatchRequest = {
        items: slice.map((item) => ({
          id: item.id,
          table: item.table,
          action: item.action as 'insert' | 'update' | 'delete',
          recordId: item.recordId,
          payload: typeof item.payload === 'string' ? JSON.parse(item.payload) : item.payload,
          priority: item.priority,
          operationVersion: item.operationVersion,
          createdAt: new Date(item.createdAt).toISOString(),
          updatedAt: new Date(item.updatedAt).toISOString(),
        })),
      };

      try {
        SyncLogger.debug('PushService: Transmission starting...', { count: slice.length });
        const response = await apiClient.post<PushBatchResponse>('/sync/push', requestPayload);
        const results = response.data.results;

        SyncLogger.info(`PushService: Batch response received with ${results.length} processing results.`);

        // Reconcile outbox item states in parallel
        await Promise.all(
          results.map(async (res) => {
            if (res.status === 'synced') {
              SyncLogger.info(`PushService: Record successfully pushed: ${res.id}`);
              await this.syncRepo.markAsSynced(res.id);
            } else if (res.status === 'conflict') {
              SyncLogger.warn(`PushService: Outbox conflict detected: ${res.id}`);
              await this.syncRepo.markAsConflict(res.id);
            } else {
              const errMsg = res.error || 'Server processing failed';
              SyncLogger.error(`PushService: Sync processing failed for outbox record: ${res.id} - ${errMsg}`);
              await this.syncRepo.markAsFailed(res.id, errMsg);
            }
          })
        );
      } catch (error: any) {
        SyncLogger.error('PushService: Sync batch transmission encountered network/server error', error);
        
        // Return batch items to failed status to trigger exponential retry loop
        const failMessage = error.message || 'Network request failed';
        await Promise.all(
          slice.map((item) => this.syncRepo.markAsFailed(item.id, failMessage))
        );
      }
    }
  }
}
