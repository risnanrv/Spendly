import { useState, useEffect } from 'react';
import { useSyncStore } from '@/stores/sync.store';
import { container } from '@/di/ServiceContainer';
import { NetworkManager } from '@/sync/NetworkManager';

/**
 * useSync hook exposes global sync statuses, outbox pending counts, connection state,
 * and a callback trigger to request manual synchronizations.
 */
export const useSync = () => {
  const status = useSyncStore((state) => state.status);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const pendingCount = useSyncStore((state) => state.pendingCount);
  const lastError = useSyncStore((state) => state.lastError);
  const [isOnline, setIsOnline] = useState(NetworkManager.isOnline());

  useEffect(() => {
    // Synchronize local connection state shift changes
    const unsubscribe = NetworkManager.addListener((online) => {
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Invokes an immediate manual synchronization run.
   */
  const triggerSync = async () => {
    try {
      const syncService = container.resolve<any>('SyncService');
      await syncService.sync();
    } catch {
      // Failures are captured inside SyncEngine and logged to the store
    }
  };

  return {
    syncStatus: status,
    lastSyncedAt,
    pendingCount,
    lastError,
    triggerSync,
    isOnline,
  };
};
