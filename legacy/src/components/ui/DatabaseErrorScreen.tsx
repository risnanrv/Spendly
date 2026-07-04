import { StyleSheet, ScrollView } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { Button } from './Button';
import { YStack } from './YStack';
import { Spacer } from './Spacer';
import { Card } from './Card';
import { Icon } from './Icon';
import { AlertTriangle } from 'lucide-react-native';

interface DatabaseErrorScreenProps {
  error: string;
  onRetry: () => void;
  onRestart?: () => void;
}

/**
 * Premium DatabaseErrorScreen rendered during migration or health diagnostics failures.
 */
export const DatabaseErrorScreen = ({
  error,
  onRetry,
  onRestart,
}: DatabaseErrorScreenProps) => {
  return (
    <Screen padded>
      <ScrollView contentContainerStyle={styles.scroll}>
        <YStack align="center" justify="center" gap={4} style={styles.container}>
          <Icon name={AlertTriangle} size="xl" color="danger" />
          <Spacer size={2} />
          
          <Text variant="titleL" align="center">
            Database Sync Failure
          </Text>
          <Text variant="bodyM" color="textSecondary" align="center">
            Spendly could not initialize the secure local SQLite database files or apply migrations.
          </Text>
          
          <Spacer size={2} />

          {/* Diagnostic message visible in development builds only */}
          {__DEV__ ? (
            <Card style={styles.devCard}>
              <YStack gap={2}>
                <Text variant="labelL" color="danger">
                  Developer Diagnostics
                </Text>
                <Text variant="bodyS" color="danger" style={styles.errorLog}>
                  {error}
                </Text>
              </YStack>
            </Card>
          ) : null}

          <Spacer size={4} />

          <YStack gap={3} style={styles.actions}>
            <Button
              variant="primary"
              label="Retry Setup"
              onPress={onRetry}
              fullWidth
            />
            {onRestart ? (
              <Button
                variant="outline"
                label="Reset & Restart Setup"
                onPress={onRestart}
                fullWidth
              />
            ) : null}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  devCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    alignSelf: 'stretch',
    padding: 16,
  },
  errorLog: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  actions: {
    alignSelf: 'stretch',
  },
});
