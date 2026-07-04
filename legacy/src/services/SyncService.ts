import { SyncEngine } from '@/sync/SyncEngine';
import { SyncScheduler } from '@/sync/SyncScheduler';

/**
 * SyncService coordinates SyncEngine runs and schedules periodic outbox
 * synchronizations, wrapping daemon control for UI and repository components.
 */
export class SyncService {
  constructor(
    private engine: SyncEngine,
    private scheduler: SyncScheduler
  ) {}

  /**
   * Invokes an immediate manual push-pull sync run.
   */
  public async sync(): Promise<void> {
    await this.engine.sync();
  }

  /**
   * Starts the background outbox monitor daemon.
   */
  public start(): void {
    this.scheduler.start();
  }

  /**
   * Stops the background outbox monitor daemon.
   */
  public stop(): void {
    this.scheduler.stop();
  }

  /**
   * Notifies the scheduler of a new pending outbox item to queue a throttled sync.
   */
  public notify(): void {
    this.scheduler.notify();
  }
}
