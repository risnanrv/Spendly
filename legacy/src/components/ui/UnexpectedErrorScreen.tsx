import { StyleSheet } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { Button } from './Button';
import { YStack } from './YStack';
import { Spacer } from './Spacer';
import { Icon } from './Icon';
import { AlertCircle } from 'lucide-react-native';

interface UnexpectedErrorScreenProps {
  error: string;
  onReset: () => void;
}

/**
 * Premium UnexpectedErrorScreen rendered on general boot crashes.
 */
export const UnexpectedErrorScreen = ({
  error,
  onReset,
}: UnexpectedErrorScreenProps) => {
  return (
    <Screen padded>
      <YStack align="center" justify="center" gap={4} style={styles.container}>
        <Icon name={AlertCircle} size="xl" color="danger" />
        <Spacer size={2} />
        
        <Text variant="titleL" align="center">
          Unexpected Error
        </Text>
        <Text variant="bodyM" color="textSecondary" align="center">
          Spendly encountered an unexpected startup crash.
        </Text>

        {__DEV__ ? (
          <Text
            variant="bodyS"
            color="danger"
            style={styles.devError}
          >
            {error}
          </Text>
        ) : null}

        <Spacer size={4} />

        <Button
          variant="primary"
          label="Reload Application"
          onPress={onReset}
          fullWidth
        />
      </YStack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
  devError: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    marginTop: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    textAlign: 'center',
  },
});
