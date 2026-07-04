import { ConflictResolver } from '@/sync/ConflictResolver';

// Silence sync logs during tests
jest.mock('@/sync/SyncLogger', () => ({
  SyncLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('ConflictResolver', () => {
  const table = 'expenses';

  const makeRecord = (
    id: string,
    operationVersion: number,
    updatedAt: string,
    extra: Record<string, any> = {}
  ) => ({
    id,
    operationVersion,
    updatedAt,
    ...extra,
  });

  describe('resolve — no local record', () => {
    it('returns remote_wins when there is no local record', () => {
      const remote = makeRecord('rec-1', 1, '2026-07-01T10:00:00Z');
      const result = ConflictResolver.resolve(table, null, remote);

      expect(result.strategy).toBe('remote_wins');
      expect(result.payload).toEqual(remote);
      expect(result.report.table).toBe(table);
    });
  });

  describe('resolve — version comparison', () => {
    it('returns local_wins when local operationVersion is higher', () => {
      const local = makeRecord('rec-1', 5, '2026-07-01T10:00:00Z');
      const remote = makeRecord('rec-1', 3, '2026-07-02T10:00:00Z');
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.strategy).toBe('local_wins');
      expect(result.payload).toEqual(local);
    });

    it('returns remote_wins when remote operationVersion is higher', () => {
      const local = makeRecord('rec-1', 2, '2026-07-02T10:00:00Z');
      const remote = makeRecord('rec-1', 4, '2026-07-01T10:00:00Z');
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.strategy).toBe('remote_wins');
      expect(result.payload).toEqual(remote);
    });
  });

  describe('resolve — timestamp (last-write-wins) when versions equal', () => {
    it('returns local_wins when local updatedAt is newer than remote', () => {
      const local = makeRecord('rec-1', 1, '2026-07-03T12:00:00Z');
      const remote = makeRecord('rec-1', 1, '2026-07-02T08:00:00Z');
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.strategy).toBe('local_wins');
    });

    it('returns remote_wins when remote updatedAt is newer than local', () => {
      const local = makeRecord('rec-1', 1, '2026-07-01T08:00:00Z');
      const remote = makeRecord('rec-1', 1, '2026-07-03T12:00:00Z');
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.strategy).toBe('remote_wins');
    });
  });

  describe('resolve — merge tie-breaker when versions and timestamps match', () => {
    it('merges fields when version and timestamps are identical', () => {
      const ts = '2026-07-01T08:00:00Z';
      const local = makeRecord('rec-1', 1, ts, { localField: 'local-value' });
      const remote = makeRecord('rec-1', 1, ts, { remoteField: 'remote-value' });
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.strategy).toBe('merge');
      expect(result.payload.localField).toBe('local-value');
      expect(result.payload.remoteField).toBe('remote-value');
    });
  });

  describe('resolve — report metadata', () => {
    it('always includes table, recordId and resolvedAt in the conflict report', () => {
      const local = makeRecord('rec-99', 2, '2026-07-01T08:00:00Z');
      const remote = makeRecord('rec-99', 3, '2026-07-01T08:00:00Z');
      const result = ConflictResolver.resolve(table, local, remote);

      expect(result.report.table).toBe(table);
      expect(result.report.recordId).toBe('rec-99');
      expect(result.report.resolvedAt).toBeInstanceOf(Date);
      expect(typeof result.report.details).toBe('string');
    });
  });
});
