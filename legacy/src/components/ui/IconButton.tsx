import React, { useCallback } from 'react';
import { Pressable, type ViewStyle, type StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { LucideProps } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { spring, pressScale } from '@/theme/motion';
import type { ThemeColors } from '@/theme/themes';

type IconButtonVariant = 'default' | 'filled' | 'ghost';

/**
 * Props for the IconButton component.
 */
interface IconButtonProps {
  /** Lucide icon component reference */
  icon: React.ComponentType<LucideProps>;
  /** Touch handler callback */
  onPress: () => void;
  /** Size dimension of the icon in dp */
  size?: number;
  /** Visual theme variations */
  variant?: IconButtonVariant;
  /** Custom icon color token */
  color?: keyof ThemeColors;
  /** Identifier for automation testing */
  testID?: string;
  /** Screen reader accessibility description */
  accessibilityLabel: string;
  /** Gray-out and disable click handlers when true */
  disabled?: boolean;
  /** Optional custom container styles */
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Reusable icon-only tappable button providing a minimum 44×44pt touch target.
 */
export const IconButton = ({
  icon: Icon,
  onPress,
  size = 24,
  variant = 'default',
  color = 'textPrimary',
  testID,
  accessibilityLabel,
  disabled = false,
  style,
}: IconButtonProps) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(pressScale.icon, spring.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, spring.snappy);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    width: Math.max(size + 20, 44),
    height: Math.max(size + 20, 44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.full,
    backgroundColor:
      variant === 'filled' ? theme.colors.bgSecondary : 'transparent',
    opacity: disabled ? theme.motion.stateOpacity.disabled : 1,
  };

  const IconCast = Icon as any;

  return (
    <AnimatedPressable
      testID={testID}
      style={[containerStyle, animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <IconCast size={size} color={theme.colors[color] as string} strokeWidth={1.5} />
    </AnimatedPressable>
  );
};
