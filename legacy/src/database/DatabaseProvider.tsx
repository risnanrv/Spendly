import React, { createContext, useContext, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { MigrationRunner } from './migrator';
import { SeedService } from './seed';
import { DatabaseHealthService } from './health';
import { Screen, Spinner, YStack, AppLogo, Spacer, Text, Button } from '@/components/ui';
import { logger } from '@/utils/logger';

interface DatabaseContextValue {
  isReady: boolean;
  error: string | null;
  retryInit: () => void;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

/**
 * DatabaseProvider runs database migrations, seeds initial data,
 * and performs health verification diagnostics before displaying child views.
 */
export const DatabaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retryInit = () => {
    setError(null);
    setRetryCount((c) => c + 1);
  };

  useEffect(() => {
    let active = true;

    const initializeDb = async () => {
      try {
        logger.info('Initializing SQLite database services...');

        // 1. Run migrations
        await MigrationRunner.run();

        // 2. Run seed
        await SeedService.seed();

        // 3. Verify health
        const isHealthy = await DatabaseHealthService.verifyHealth();
        if (!isHealthy) {
          throw new Error('Database failed health diagnostics checks.');
        }

        if (active) {
          setIsReady(true);
        }
      } catch (err: any) {
        logger.error('Database initialization lifecycle failed:', err);
        if (active) {
          setError(err.message || 'An error occurred during database setup.');
        }
      }
    };

    initializeDb();

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (error) {
    return (
      <Screen padded>
        <YStack align="center" justify="center" gap={4} style={styles.center}>
          <AppLogo size="md" />
          <Spacer size={2} />
          <Text variant="titleL" color="danger">Database Error</Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            Failed to initialize the local database files or apply migrations.
          </Text>
          <Text variant="bodyS" color="danger" style={styles.errorText}>
            {error}
          </Text>
          <Spacer size={4} />
          <Button variant="primary" label="Try Initializing Again" onPress={retryInit} />
        </YStack>
      </Screen>
    );
  }

  if (!isReady) {
    return (
      <Screen padded={false}>
        <YStack align="center" justify="center" style={styles.center}>
          <AppLogo size="lg" />
          <Spacer size={4} />
          <Spinner size="lg" />
          <Spacer size={2} />
          <Text variant="bodyM" color="textSecondary">
            Configuring storage engine...
          </Text>
        </YStack>
      </Screen>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, error, retryInit }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 24,
  },
  errorText: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    marginTop: 8,
  },
});
