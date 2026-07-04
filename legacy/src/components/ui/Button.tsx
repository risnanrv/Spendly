import { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Text } from './Text';
import { spring, pressScale } from '@/theme/motion';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props for the animated Button component.
 */
interface ButtonProps {
  /** Press handler callback */
  onPress: () => void;
  /** Label text content */
  label: string;
  /** Visual variation of the button */
  variant?: ButtonVariant;
  /** Dimension size of the button */
  size?: ButtonSize;
  /** Display spinner instead of text when true */
  loading?: boolean;
  /** Prevent press events and grey-out visual state when true */
  disabled?: boolean;
  /** Stretch to full width of parent container */
  fullWidth?: boolean;
  /** Screen reader accessibility description */
  accessibilityLabel?: string;
  /** Automation identifier */
  testID?: string;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Premium Button component featuring Reanimated 3 spring press scaling,
 * 5 visual variants, loader overlays, and touch targets minimum compliance.
 */
export const Button = ({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(pressScale.button, spring.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, spring.snappy);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(variant, theme.colors, isDisabled),
    borderWidth: getBorderWidth(variant, theme),
    borderColor: getBorderColor(variant, theme.colors),
    borderRadius: theme.radius.md,
    height: theme.sizes.button[size],
    paddingHorizontal: getSizePadding(size, theme),
    opacity: isDisabled ? theme.motion.stateOpacity.disabled : 1,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows[variant === 'primary' ? 'sm' : 'none'],
  };

  const textColor = getTextColor(variant);

  return (
    <AnimatedPressable
      testID={testID}
      style={[containerStyle, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={textColor === 'textPrimary' || textColor === 'textBrand' ? theme.colors.textPrimary : '#FFFFFF'}
        />
      ) : (
        <Text variant="labelL" color={textColor} style={styles.label}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────
const getBackgroundColor = (
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  disabled: boolean,
): string => {
  if (disabled) return colors.bgSecondary;
  switch (variant) {
    case 'primary': return colors.brandPrimary;
    case 'secondary': return colors.brandLight;
    case 'destructive': return colors.danger;
    case 'outline':
    case 'ghost':
    default: return 'transparent';
  }
};

const getBorderWidth = (variant: ButtonVariant, theme: ReturnType<typeof useTheme>): number => {
  return variant === 'outline' ? theme.borders.width.thin : theme.borders.width.none;
};

const getBorderColor = (variant: ButtonVariant, colors: ReturnType<typeof useTheme>['colors']): string | undefined => {
  return variant === 'outline' ? colors.borderDefault : undefined;
};

const getTextColor = (variant: ButtonVariant): 'textInverse' | 'textBrand' | 'textPrimary' | 'danger' => {
  switch (variant) {
    case 'primary':
    case 'destructive':
      return 'textInverse';
    case 'secondary':
      return 'textBrand';
    case 'outline':
    case 'ghost':
    default:
      return 'textPrimary';
  }
};

const getSizePadding = (size: ButtonSize, theme: ReturnType<typeof useTheme>): number => {
  switch (size) {
    case 'sm': return theme.spacing[4];
    case 'md': return theme.spacing[5];
    case 'lg': return theme.spacing[6];
  }
};

const styles = StyleSheet.create({
  label: {
    letterSpacing: 0.1,
  },
});
