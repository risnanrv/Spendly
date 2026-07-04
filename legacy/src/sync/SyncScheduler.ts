import { SyncEngine } from './SyncEngine';
import { NetworkManager } from './NetworkManager';
import { SyncLogger } from './SyncLogger';
import { useSyncStore } from '@/stores/sync.store';
import type { ISyncRepository } from '@/database/repositories/interfaces';

/**
 * SyncScheduler coordinates automated background sync triggers, checks outbox sizes,
 * enforces throttle constraints, and updates the global sync store badge counts.
 */
export class SyncScheduler {
  private static intervalId: any = null;
  private static lastSyncTime = 0;
  private static readonly THROTTLE_WINDOW_MS = 5000;
  private static syncTimeoutId: any = null;

  constructor(
    private syncEngine: SyncEngine,
    private syncRepo: ISyncRepository
  ) {}

  /**
   * Starts periodic polling and subscribes to connectivity shift monitors.
   */
  public start(): void {
    if (SyncScheduler.intervalId) return;

    SyncLogger.info('SyncScheduler: Starting sync scheduler daemon...');

    // Initialize network listener
    NetworkManager.initialize();

    // Seed state and trigger initial push check
    this.updatePendingCount();
    this.notify();

    // Trigger outbox scan checks every 30 seconds
    SyncScheduler.intervalId = setInterval(() => {
      this.checkAndSync();
    }, 30000);
  }

  /**
   * Runs recurring outbox scanner checks.
   */
  private async checkAndSync(): Promise<void> {
    try {
      await this.updatePendingCount();
      const count = useSyncStore.getState().pendingCount;

      if (count > 0 && NetworkManager.isOnline() && !SyncEngine.isSyncActive()) {
        SyncLogger.info(`SyncScheduler: Scanner detected ${count} pending outbox items. Invoking sync...`);
        await this.syncEngine.sync();
        await this.updatePendingCount();
      }
    } catch (e) {
      SyncLogger.error('SyncScheduler: Outbox scan error:', e);
    }
  }

  /**
   * Triggers a throttled outbox push loop asynchronously.
   */
  public notify(): void {
    if (SyncScheduler.syncTimeoutId) {
      return;
    }

    const now = Date.now();
    const elapsed = now - SyncScheduler.lastSyncTime;

    if (elapsed >= SyncScheduler.THROTTLE_WINDOW_MS) {
      this.executeSync();
    } else {
      const delay = SyncScheduler.THROTTLE_WINDOW_MS - elapsed;
      SyncLogger.debug(`SyncScheduler: Notify throttled. Scheduling sync in ${delay}ms`);
      
      SyncScheduler.syncTimeoutId = setTimeout(() => {
        SyncScheduler.syncTimeoutId = null;
        this.executeSync();
      }, delay);
    }
  }

  private async executeSync(): Promise<void> {
    SyncScheduler.lastSyncTime = Date.now();
    try {
      await this.syncEngine.sync();
    } catch (e) {
      SyncLogger.error('SyncScheduler: Synchronization failed during notify execution:', e);
    } finally {
      await this.updatePendingCount();
    }
  }

  /**
   * Refreshes the global Zustand store outbox count value.
   */
  public async updatePendingCount(): Promise<void> {
    try {
      const count = await this.syncRepo.getPendingCount();
      useSyncStore.getState().setPendingCount(count);
    } catch (e) {
      SyncLogger.error('SyncScheduler: Failed to update pending outbox count:', e);
    }
  }

  /**
   * Cleans up running loops and timers.
   */
  public stop(): void {
    if (SyncScheduler.intervalId) {
      clearInterval(SyncScheduler.intervalId);
      SyncScheduler.intervalId = null;
    }
    if (SyncScheduler.syncTimeoutId) {
      clearTimeout(SyncScheduler.syncTimeoutId);
      SyncScheduler.syncTimeoutId = null;
    }
    NetworkManager.destroy();
    SyncLogger.info('SyncScheduler: Sync scheduler daemon stopped.');
  }
}
