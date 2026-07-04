import { StyleSheet, View } from 'react-native';
import { Spinner } from './Spinner';
import { Text } from './Text';
import { YStack } from './YStack';
import { Spacer } from './Spacer';

interface GlobalLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * GlobalLoadingOverlay creates a blocking screen spinner during intensive operations.
 */
export const GlobalLoadingOverlay = ({
  visible,
  message = 'Saving...',
}: GlobalLoadingOverlayProps) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <YStack align="center" justify="center" style={styles.card}>
        <Spinner size="md" />
        <Spacer size={2} />
        <Text variant="labelM" color="textPrimary">
          {message}
        </Text>
      </YStack>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
