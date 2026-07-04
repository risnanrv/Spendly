import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Loader2 } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import type { IconSizeToken } from '@/theme/sizes';
import type { ThemeColors } from '@/theme/themes';

interface SpinnerProps {
  size?: IconSizeToken | number;
  color?: keyof ThemeColors;
}

export const Spinner = ({ size = 'md', color = 'brandPrimary' }: SpinnerProps) => {
  const theme = useTheme();
  const rotation = useSharedValue(0);

  const resolvedSize = typeof size === 'string' ? theme.sizes.icon[size] : size;
  const resolvedColor = theme.colors[color] as string;

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    return () => {
      cancelAnimation(rotation);
    };
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Loader2 size={resolvedSize} color={resolvedColor} strokeWidth={2} />
    </Animated.View>
  );
};
