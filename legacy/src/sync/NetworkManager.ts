import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { SyncLogger } from './SyncLogger';

type NetworkCallback = (online: boolean, isExpensive: boolean) => void;

/**
 * NetworkManager interfaces with NetInfo to track online status, expensive connections,
 * and cellular/wifi changes, notifying the sync engine on reconnects.
 */
export class NetworkManager {
  private static listeners = new Set<NetworkCallback>();
  private static isConnected = true;
  private static isExpensive = false;
  private static unsubscribe: (() => void) | null = null;

  /**
   * Initializes netinfo listeners to monitor active connections.
   */
  public static initialize(): void {
    if (this.unsubscribe) return;

    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasConnected = this.isConnected;
      
      // Determine online state based on both connection presence and internet reachability
      this.isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      
      // Determine if network is cellular/expensive
      this.isExpensive = Boolean(
        state.details &&
        'isConnectionExpensive' in state.details &&
        state.details.isConnectionExpensive
      );

      SyncLogger.info('Network connectivity state change detected', {
        isConnected: this.isConnected,
        connectionType: state.type,
        isExpensive: this.isExpensive,
      });

      const onlineNow = this.isConnected;
      
      // Notify listeners
      this.listeners.forEach((callback) => {
        try {
          callback(onlineNow, this.isExpensive);
        } catch (e) {
          SyncLogger.error('Error in network listener callback:', e);
        }
      });

      // Trigger automatic sync trigger when recovering online status
      if (!wasConnected && onlineNow) {
        SyncLogger.info('Network link recovered. Triggering automated outbox sync...');
        try {
          const syncService = require('@/di/ServiceContainer').container.resolve('SyncService');
          syncService.notify();
        } catch (e) {
          SyncLogger.error('Failed to resolve and notify SyncService upon link recovery:', e);
        }
      }
    });
  }

  public static addListener(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public static isOnline(): boolean {
    return this.isConnected;
  }

  public static isConnectionExpensive(): boolean {
    return this.isExpensive;
  }

  public static destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners.clear();
  }
}
