import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import type { ChartDataPoint } from '@/models/report';

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  width?: number;
  barWidth?: number;
  spacing?: number;
  accessibilityLabel?: string;
}

/**
 * Bar chart wrapper around react-native-gifted-charts.
 * Used for category comparisons and month-over-month views.
 * Theme-aware, animated, and supports per-bar color overrides.
 */
export const BarChart = memo(({
  data,
  height = 160,
  width,
  barWidth = 24,
  spacing = 12,
  accessibilityLabel,
}: BarChartProps) => {
  const theme = useTheme();

  const chartData = data.map((d) => ({
    value: d.value / 100, // display in major currency units
    label: d.label,
    frontColor: d.frontColor ?? d.color ?? theme.colors.brandPrimary,
  }));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Bar chart showing category breakdown'}
    >
      <GiftedBarChart
        data={chartData}
        height={height}
        {...(width !== undefined ? { width } : {})}
        barWidth={barWidth}
        spacing={spacing}
        hideRules
        hideYAxisText
        xAxisColor={theme.colors.borderDefault}
        yAxisColor="transparent"
        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
        animationDuration={600}
        isAnimated
        roundedTop
        barBorderRadius={4}
      />
    </View>
  );
});

BarChart.displayName = 'BarChart';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
