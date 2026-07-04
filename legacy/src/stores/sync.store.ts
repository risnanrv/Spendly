import { create } from 'zustand';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: number | null;
  pendingCount: number;
  lastError: string | null;
  setStatus: (status: SyncStatus) => void;
  setLastSyncedAt: (timestamp: number) => void;
  setPendingCount: (count: number) => void;
  setLastError: (error: string | null) => void;
  reset: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'idle',
  lastSyncedAt: null,
  pendingCount: 0,
  lastError: null,

  setStatus: (status) => set({ status }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastError: (lastError) => set({ lastError }),
  reset: () => set({ status: 'idle', pendingCount: 0, lastError: null }),
}));
