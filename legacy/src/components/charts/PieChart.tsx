import { memo } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { PieChart as GiftedPieChart } from 'react-native-gifted-charts';
import { useTheme } from '@/hooks/useTheme';
import type { ChartDataPoint } from '@/models/report';

interface PieChartProps {
  data: ChartDataPoint[];
  size?: number;
  innerRadius?: number;
  label?: string;
  subLabel?: string;
  accessibilityLabel?: string;
}

/**
 * Pie chart wrapper around react-native-gifted-charts.
 * Never exposes gifted-charts API directly to the rest of the app.
 * Theme-aware, animated, and accessible.
 */
export const PieChart = memo(({
  data,
  size = 160,
  innerRadius = 50,
  label,
  subLabel,
  accessibilityLabel,
}: PieChartProps) => {
  const theme = useTheme();

  const chartData = data.map((d) => ({
    value: d.value,
    color: d.color ?? theme.colors.brandPrimary,
    text: d.label,
    focused: false,
  }));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? `Pie chart showing ${label ?? 'data distribution'}`}
    >
      <GiftedPieChart
        data={chartData}
        radius={size / 2}
        innerRadius={innerRadius}
        showText={false}
        centerLabelComponent={() =>
          label ? (
            <View style={styles.center}>
              <RNText style={[styles.centerLabel, { color: theme.colors.textPrimary }]}>
                {label}
              </RNText>
              {subLabel && (
                <RNText style={[styles.centerSub, { color: theme.colors.textSecondary }]}>
                  {subLabel}
                </RNText>
              )}
            </View>
          ) : null
        }
        animationDuration={600}
      />
    </View>
  );
});

PieChart.displayName = 'PieChart';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  centerSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
