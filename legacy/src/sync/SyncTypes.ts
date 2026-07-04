export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export type QueueItemStatus = 'pending' | 'processing' | 'synced' | 'failed' | 'conflict';

export type SyncPriority = 'high' | 'normal' | 'low';

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  recordId: string;
  payload: string; // JSON serialized
  status: QueueItemStatus;
  attempts: number;
  retryCount: number;
  syncedAt: Date | null;
  lastAttempt: Date | null;
  lastError: string | null;
  priority: SyncPriority;
  operationVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string; // 'wifi' | 'cellular' | 'none' etc.
  isExpensive: boolean;
}

export interface PushBatchRequest {
  items: Array<{
    id: string;
    table: string;
    action: 'insert' | 'update' | 'delete';
    recordId: string;
    payload: Record<string, any>;
    priority: string;
    operationVersion: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface PushBatchResponse {
  results: Array<{
    id: string;
    status: 'synced' | 'failed' | 'conflict';
    error?: string;
  }>;
}

export interface PullRequest {
  lastSyncAt: string | null; // ISO Date String
}

export interface PullResponse {
  changes: Array<{
    id: string;
    table: string;
    action: 'insert' | 'update' | 'delete';
    recordId: string;
    payload: Record<string, any>;
    operationVersion: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }>;
  syncTimestamp: string; // Server time representing this sync checkpoint
}

export interface ConflictResolution {
  recordId: string;
  table: string;
  strategy: 'local_wins' | 'remote_wins' | 'merge';
  resolvedPayload: Record<string, any>;
}
