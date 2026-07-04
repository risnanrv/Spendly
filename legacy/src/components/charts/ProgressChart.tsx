import { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { Text } from '@/components/ui';

interface ProgressChartProps {
  /** 0–1 progress ratio */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
  accessibilityLabel?: string;
}

/**
 * Animated horizontal progress bar chart.
 * Used for budget progress visualization.
 * Does not depend on gifted-charts since a native animated bar is optimal here.
 */
export const ProgressChart = memo(({
  progress,
  color,
  trackColor,
  height = 10,
  showLabel = true,
  label,
  accessibilityLabel,
}: ProgressChartProps) => {
  const theme = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const barColor = color ?? theme.colors.brandPrimary;
  const barTrack = trackColor ?? theme.colors.bgSecondary;

  const widthAnim = useSharedValue(0);

  useEffect(() => {
    widthAnim.value = withTiming(clampedProgress, { duration: 700 });
  }, [clampedProgress, widthAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
  }));

  return (
    <View
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
      accessibilityLabel={accessibilityLabel ?? `${label ?? 'Progress'}: ${Math.round(clampedProgress * 100)}%`}
    >
      {showLabel && label && (
        <Text variant="labelS" color="textSecondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View style={[styles.track, { height, backgroundColor: barTrack, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.bar,
            { height, backgroundColor: barColor, borderRadius: height / 2 },
            animatedStyle,
          ]}
        />
      </View>
    </View>
  );
});

ProgressChart.displayName = 'ProgressChart';

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  label: {
    marginBottom: 4,
  },
});
