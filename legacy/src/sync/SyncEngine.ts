import { SyncLogger } from './SyncLogger';
import { PushService } from './PushService';
import { PullService } from './PullService';
import { NetworkManager } from './NetworkManager';
import { useAuthStore } from '@/stores/auth.store';
import { useSyncStore } from '@/stores/sync.store';

/**
 * SyncEngine is the single entry point coordinating Push and Pull operations
 * sequentially inside a single concurrent synchronization session lock.
 */
export class SyncEngine {
  private static isSyncing = false;

  constructor(
    private pushService: PushService,
    private pullService: PullService
  ) {}

  /**
   * Coordinates push and pull operations inside a single session lock.
   */
  public async sync(): Promise<void> {
    if (SyncEngine.isSyncing) {
      SyncLogger.info('SyncEngine: Synchronizer execution bypass - sync already in progress.');
      return;
    }

    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated || !accessToken) {
      SyncLogger.warn('SyncEngine: Synchronizer execution paused - unauthenticated session.');
      useSyncStore.getState().setStatus('offline');
      return;
    }

    if (!NetworkManager.isOnline()) {
      SyncLogger.warn('SyncEngine: Synchronizer execution paused - device is offline.');
      useSyncStore.getState().setStatus('offline');
      return;
    }

    SyncEngine.isSyncing = true;
    useSyncStore.getState().setStatus('syncing');

    try {
      SyncLogger.info('SyncEngine: Beginning push synchronization (outbox push)...');
      await this.pushService.push();

      SyncLogger.info('SyncEngine: Beginning pull synchronization (cloud pull)...');
      await this.pullService.pull();

      useSyncStore.getState().setLastSyncedAt(Date.now());
      useSyncStore.getState().setStatus('idle');
      useSyncStore.getState().setLastError(null);
      SyncLogger.info('SyncEngine: Synchronization sequence completed successfully.');
    } catch (error: any) {
      SyncLogger.error('SyncEngine: Critical synchronization sequence failure:', error);
      useSyncStore.getState().setStatus('error');
      useSyncStore.getState().setLastError(error.message || 'Sync failed');
      throw error;
    } finally {
      SyncEngine.isSyncing = false;
    }
  }

  public static isSyncActive(): boolean {
    return this.isSyncing;
  }
}
