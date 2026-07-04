import { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import type { RadiusToken } from '@/theme/radius';

interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  radius?: RadiusToken;
  style?: ViewStyle;
}

export const Skeleton = ({
  width = '100%',
  height = 20,
  radius = 'sm',
  style,
}: SkeletonProps) => {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const baseStyle: ViewStyle = {
    width,
    height,
    borderRadius: theme.radius[radius],
    backgroundColor: theme.colors.borderStrong, // neutral medium grey for loading
  };

  return <Animated.View style={[baseStyle, animatedStyle, style]} />;
};
