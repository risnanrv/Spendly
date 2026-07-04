import { View, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { Text } from './Text';

interface LoadingProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

/**
 * Loading indicator. Use fullScreen=true for page-level loading states.
 */
export const Loading = ({ size = 'large', message, fullScreen = false, style }: LoadingProps) => {
  const theme = useTheme();

  return (
    <View style={[fullScreen ? styles.fullScreen : styles.inline, style]}>
      <ActivityIndicator size={size} color={theme.colors.brandPrimary} />
      {message ? (
        <Text variant="bodyM" color="textSecondary" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  message: {
    marginTop: 4,
  },
});
