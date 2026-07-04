import { StyleSheet } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { YStack } from './YStack';
import { AppLogo } from './AppLogo';
import { Spacer } from './Spacer';
import { Spinner } from './Spinner';

interface InitializationScreenProps {
  statusText?: string;
}

/**
 * Premium InitializationScreen loaded during the sequential boot pipeline.
 */
export const InitializationScreen = ({
  statusText = 'Initializing secure environments...',
}: InitializationScreenProps) => {
  return (
    <Screen padded={false}>
      <YStack align="center" justify="center" style={styles.center}>
        <AppLogo size="lg" />
        <Spacer size={4} />
        <Spinner size="lg" />
        <Spacer size={2} />
        <Text variant="bodyM" color="textSecondary">
          {statusText}
        </Text>
      </YStack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
