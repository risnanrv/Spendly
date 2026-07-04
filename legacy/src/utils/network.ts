import * as Network from 'expo-network';
import { logger } from './logger';

/**
 * Checks if the device has an active internet connection.
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    const state = await Network.getNetworkStateAsync();
    return Boolean(state.isConnected && state.isInternetReachable);
  } catch (error) {
    logger.error('Failed to get network state:', error);
    // Fallback to true if network check fails to avoid blocking users unnecessarily
    return true;
  }
};
