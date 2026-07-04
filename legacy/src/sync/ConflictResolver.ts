import { SyncLogger } from './SyncLogger';

export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'merge';

export interface ConflictReport {
  table: string;
  recordId: string;
  strategy: ConflictResolutionStrategy;
  resolvedAt: Date;
  details: string;
}

/**
 * ConflictResolver applies conflict resolution strategies (e.g. Last-Write-Wins)
 * between local SQLite snapshots and remote payload configurations.
 */
export class ConflictResolver {
  /**
   * Resolves a conflicts by comparing operationVersion fields and updatedAt timestamps.
   */
  public static resolve(
    table: string,
    local: Record<string, any> | null,
    remote: Record<string, any>
  ): { strategy: ConflictResolutionStrategy; payload: Record<string, any>; report: ConflictReport } {
    const recordId = remote.id || remote.key || 'unknown';

    // If local record does not exist, remote automatically wins
    if (!local) {
      const report: ConflictReport = {
        table,
        recordId,
        strategy: 'remote_wins',
        resolvedAt: new Date(),
        details: 'Local record is absent. Remote applied as insert.',
      };
      return { strategy: 'remote_wins', payload: remote, report };
    }

    const localVer = Number(local.operationVersion || local.operation_version || 1);
    const remoteVer = Number(remote.operationVersion || remote.operation_version || 1);

    const localUpdated = new Date(local.updatedAt || local.updated_at).getTime();
    const remoteUpdated = new Date(remote.updatedAt || remote.updated_at).getTime();

    // 1. Version Comparison Priority
    if (localVer > remoteVer) {
      return this.localWins(table, recordId, local, remote, `Local version ${localVer} > Remote version ${remoteVer}`);
    } else if (remoteVer > localVer) {
      return this.remoteWins(table, recordId, local, remote, `Remote version ${remoteVer} > Local version ${localVer}`);
    }

    // 2. Last-Write-Wins Timestamp Priority
    if (localUpdated > remoteUpdated) {
      return this.localWins(
        table,
        recordId,
        local,
        remote,
        `Local update time (${localUpdated}) is newer than Remote (${remoteUpdated})`
      );
    } else if (remoteUpdated > localUpdated) {
      return this.remoteWins(
        table,
        recordId,
        local,
        remote,
        `Remote update time (${remoteUpdated}) is newer than Local (${localUpdated})`
      );
    }

    // 3. Tie-breaker Merge
    const merged = { ...local, ...remote };
    const report: ConflictReport = {
      table,
      recordId,
      strategy: 'merge',
      resolvedAt: new Date(),
      details: 'Timestamps and operation versions match exactly. Merging field properties.',
    };
    
    SyncLogger.info(`Conflict resolved via merge strategy for ${table} ${recordId}. Reason: Timestamps and operation versions match exactly. Merging field properties.`);
    return { strategy: 'merge', payload: merged, report };
  }

  private static localWins(
    table: string,
    recordId: string,
    local: Record<string, any>,
    _remote: Record<string, any>,
    reason: string
  ) {
    const report: ConflictReport = {
      table,
      recordId,
      strategy: 'local_wins',
      resolvedAt: new Date(),
      details: `Local wins. Reason: ${reason}`,
    };
    SyncLogger.info(`Conflict resolved: Local Wins for ${table} ${recordId}. Reason: ${reason}`);
    return { strategy: 'local_wins' as const, payload: local, report };
  }

  private static remoteWins(
    table: string,
    recordId: string,
    _local: Record<string, any>,
    remote: Record<string, any>,
    reason: string
  ) {
    const report: ConflictReport = {
      table,
      recordId,
      strategy: 'remote_wins',
      resolvedAt: new Date(),
      details: `Remote wins. Reason: ${reason}`,
    };
    SyncLogger.info(`Conflict resolved: Remote Wins for ${table} ${recordId}. Reason: ${reason}`);
    return { strategy: 'remote_wins' as const, payload: remote, report };
  }
}
