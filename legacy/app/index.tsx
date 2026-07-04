import { useEffect, useState, useCallback } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { AppInitializer } from '@/utils/AppInitializer';
import { secureStorage } from '@/utils/storage';
import { logger } from '@/utils/logger';
import {
  InitializationScreen,
  DatabaseErrorScreen,
  UnexpectedErrorScreen,
} from '@/components/ui';

/**
 * Root Entry Component.
 * Coordinates AppInitializer boot lifecycle sequence, displaying
 * progress stages or custom error boundaries when startup diagnostics fail.
 */
export default function Index() {
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [statusText, setStatusText] = useState('Initializing secure environments...');
  const [bootError, setBootError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<'database' | 'unexpected' | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setBootError(null);
    setErrorType(null);
    setRetryCount((c) => c + 1);
  }, []);

  const handleRestart = useCallback(async () => {
    logger.warn('Index: Requesting full secure storage reset and restart...');
    try {
      await secureStorage.clearAll();
      handleRetry();
    } catch (e) {
      logger.error('Failed to wipe storage:', e);
    }
  }, [handleRetry]);

  useEffect(() => {
    let active = true;

    const runInitializer = async () => {
      try {
        await AppInitializer.initialize((msg) => {
          if (active) setStatusText(msg);
        });

        if (active) {
          setIsReady(true);
        }
      } catch (err: any) {
        logger.error('AppIndex: Initialization failed:', err);
        if (active) {
          const errMsg = err?.message || '';
          const isDbError =
            errMsg.toLowerCase().includes('database') ||
            errMsg.toLowerCase().includes('sqlite') ||
            errMsg.toLowerCase().includes('drizzle') ||
            errMsg.toLowerCase().includes('migration');

          setErrorType(isDbError ? 'database' : 'unexpected');
          setBootError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    };

    runInitializer();

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (bootError) {
    if (errorType === 'database') {
      return (
        <DatabaseErrorScreen
          error={bootError.message}
          onRetry={handleRetry}
          onRestart={handleRestart}
        />
      );
    }

    return (
      <UnexpectedErrorScreen
        error={bootError.message}
        onReset={handleRetry}
      />
    );
  }

  if (!isReady) {
    return <InitializationScreen statusText={statusText} />;
  }

  return <Redirect href={isAuthenticated ? '/(app)' : '/(auth)'} />;
}
