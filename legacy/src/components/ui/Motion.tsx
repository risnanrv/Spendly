import React, { useEffect } from 'react';
import { type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface MotionProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const FadeIn = ({ children, duration = 300, style }: MotionProps) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.quad),
    });
  }, [opacity, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

interface SlideInProps extends MotionProps {
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
}

export const SlideIn = ({
  children,
  duration = 300,
  direction = 'up',
  offset = 50,
  style,
}: SlideInProps) => {
  const opacity = useSharedValue(0);
  const translation = useSharedValue(
    direction === 'up' || direction === 'left' ? offset : -offset
  );

  useEffect(() => {
    opacity.value = withTiming(1, { duration });
    translation.value = withSpring(0, {
      damping: 20,
      stiffness: 150,
    });
  }, [opacity, translation, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    const transformStyle =
      direction === 'up' || direction === 'down'
        ? { translateY: translation.value }
        : { translateX: translation.value };

    return {
      opacity: opacity.value,
      transform: [transformStyle],
    };
  });

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};

export const ScaleIn = ({ children, duration = 250, style }: MotionProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  useEffect(() => {
    opacity.value = withTiming(1, { duration });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 180,
    });
  }, [opacity, scale, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
};
