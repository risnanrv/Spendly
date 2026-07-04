/**
 * Integration test: ConflictResolver ↔ sync data flow
 *
 * Tests that the ConflictResolver correctly handles real-world sync scenarios:
 * network payloads arriving with varied version states and timestamp orderings.
 */
import { ConflictResolver } from '@/sync/ConflictResolver';

// Silence SyncLogger in tests
jest.mock('@/sync/SyncLogger', () => ({
  SyncLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const table = 'expenses';

const record = (
  id: string,
  ver: number,
  updatedAt: string,
  extra: Record<string, any> = {}
) => ({ id, operationVersion: ver, updatedAt, ...extra });

describe('Sync Conflict Resolution Integration', () => {
  describe('fresh device sync (no local data)', () => {
    it('accepts all remote records when local has nothing', () => {
      const remoteRecords = [
        record('r1', 1, '2026-07-01T10:00:00Z', { title: 'Coffee' }),
        record('r2', 2, '2026-07-02T09:00:00Z', { title: 'Lunch' }),
      ];

      remoteRecords.forEach((remote) => {
        const { strategy } = ConflictResolver.resolve(table, null, remote);
        expect(strategy).toBe('remote_wins');
      });
    });
  });

  describe('concurrent edit scenarios', () => {
    it('server wins when server version is ahead of local', () => {
      const local  = record('e1', 2, '2026-07-01T10:00:00Z', { title: 'Old Title' });
      const remote = record('e1', 5, '2026-07-02T10:00:00Z', { title: 'Updated' });

      const { strategy, payload } = ConflictResolver.resolve(table, local, remote);
      expect(strategy).toBe('remote_wins');
      expect(payload.title).toBe('Updated');
    });

    it('local wins after offline edits when local version is newer', () => {
      const local  = record('e2', 7, '2026-07-03T12:00:00Z', { title: 'Offline Edit' });
      const remote = record('e2', 4, '2026-07-01T08:00:00Z', { title: 'Stale' });

      const { strategy, payload } = ConflictResolver.resolve(table, local, remote);
      expect(strategy).toBe('local_wins');
      expect(payload.title).toBe('Offline Edit');
    });

    it('newer timestamp wins when versions are identical', () => {
      const ts1 = '2026-07-01T08:00:00Z';
      const ts2 = '2026-07-02T15:00:00Z';

      const local  = record('e3', 3, ts2, { title: 'Local Newer' });
      const remote = record('e3', 3, ts1, { title: 'Remote Older' });

      const { strategy } = ConflictResolver.resolve(table, local, remote);
      expect(strategy).toBe('local_wins');
    });

    it('merges fields when version and timestamp are exactly equal', () => {
      const ts = '2026-07-01T12:00:00Z';
      const local  = record('e4', 1, ts, { localOnlyField: 'A' });
      const remote = record('e4', 1, ts, { remoteOnlyField: 'B' });

      const { strategy, payload } = ConflictResolver.resolve(table, local, remote);
      expect(strategy).toBe('merge');
      expect(payload.localOnlyField).toBe('A');
      expect(payload.remoteOnlyField).toBe('B');
    });
  });

  describe('multi-record batch conflict resolution', () => {
    it('resolves each record independently in a batch', () => {
      const pairs = [
        { local: record('b1', 1, '2026-07-01T10:00:00Z'), remote: record('b1', 2, '2026-07-02T10:00:00Z') },
        { local: record('b2', 3, '2026-07-03T10:00:00Z'), remote: record('b2', 1, '2026-07-01T10:00:00Z') },
        { local: null,                                     remote: record('b3', 1, '2026-07-01T10:00:00Z') },
      ];

      const results = pairs.map(({ local, remote }) =>
        ConflictResolver.resolve(table, local, remote)
      );

      expect(results[0]?.strategy).toBe('remote_wins');
      expect(results[1]?.strategy).toBe('local_wins');
      expect(results[2]?.strategy).toBe('remote_wins');
    });

    it('returns valid report objects for all resolved conflicts', () => {
      const local  = record('r1', 1, '2026-07-01T10:00:00Z');
      const remote = record('r1', 2, '2026-07-02T10:00:00Z');
      const { report } = ConflictResolver.resolve(table, local, remote);

      expect(report.table).toBe(table);
      expect(report.recordId).toBe('r1');
      expect(report.resolvedAt).toBeInstanceOf(Date);
      expect(typeof report.details).toBe('string');
      expect(['local_wins', 'remote_wins', 'merge']).toContain(report.strategy);
    });
  });
});
