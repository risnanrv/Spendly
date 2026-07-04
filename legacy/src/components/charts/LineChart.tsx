import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import type { ChartDataPoint } from '@/models/report';

interface LineChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
  width?: number;
  curved?: boolean;
  showDots?: boolean;
  accessibilityLabel?: string;
}

/**
 * Line chart wrapper around react-native-gifted-charts.
 * Used for daily/monthly spending trends.
 * Theme-aware and animated.
 */
export const LineChart = memo(({
  data,
  color,
  height = 160,
  width,
  curved = true,
  showDots = false,
  accessibilityLabel,
}: LineChartProps) => {
  const theme = useTheme();

  const lineColor = color ?? theme.colors.brandPrimary;

  const chartData = data.map((d) => ({
    value: d.value / 100, // display in major currency units
    label: d.label,
    dataPointColor: lineColor,
  }));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Line chart showing spending trend'}
    >
      <GiftedLineChart
        data={chartData}
        height={height}
        {...(width !== undefined ? { width } : {})}
        color={lineColor}
        curved={curved}
        hideDataPoints={!showDots}
        hideRules
        hideYAxisText
        xAxisColor={theme.colors.borderDefault}
        yAxisColor="transparent"
        areaChart
        startFillColor={lineColor}
        startOpacity={0.15}
        endFillColor={lineColor}
        endOpacity={0}
        animateOnDataChange
        animationDuration={600}
        thickness={2}
        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        noOfSections={4}
      />
    </View>
  );
});

LineChart.displayName = 'LineChart';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
