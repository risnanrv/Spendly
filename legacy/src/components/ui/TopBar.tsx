import { StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { XStack } from './XStack';
import { Text } from './Text';

interface TopBarProps {
  title: string | React.ReactNode;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const TopBar = ({ title, leftAction, rightAction, style }: TopBarProps) => {
  const theme = useTheme();

  return (
    <XStack
      justify="space-between"
      align="center"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bgPrimary,
          borderBottomWidth: theme.borders.width.thin,
          borderBottomColor: theme.colors.borderSubtle,
          paddingHorizontal: theme.layout.screenHorizontalPadding,
        },
        style,
      ]}
    >
      <XStack gap={3} style={styles.left}>
        {leftAction}
        {typeof title === 'string' ? (
          <Text variant="titleM" color="textPrimary">
            {title}
          </Text>
        ) : (
          title
        )}
      </XStack>
      {rightAction ? <XStack>{rightAction}</XStack> : null}
    </XStack>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    alignSelf: 'stretch',
  },
  left: {
    flex: 1,
  },
});
