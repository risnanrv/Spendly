import React, { useCallback } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { LucideProps } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { spring, pressScale } from '@/theme/motion';

interface FloatingActionButtonProps {
  icon: React.ComponentType<LucideProps>;
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const FloatingActionButton = ({
  icon: IconComponent,
  onPress,
  accessibilityLabel,
  disabled = false,
}: FloatingActionButtonProps) => {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(pressScale.fab, spring.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, spring.snappy);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    position: 'absolute',
    bottom: theme.spacing[6],
    right: theme.spacing[6],
    width: theme.layout.fabSize,
    height: theme.layout.fabSize,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? theme.motion.stateOpacity.disabled : 1,
    zIndex: theme.zIndex.sticky,
    ...theme.shadows.lg,
  };

  const IconComponentCast = IconComponent as any;

  return (
    <AnimatedPressable
      style={[containerStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <IconComponentCast size={24} color={theme.colors.textInverse as string} strokeWidth={2} />
    </AnimatedPressable>
  );
};
