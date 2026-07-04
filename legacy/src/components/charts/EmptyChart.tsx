import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BarChart2 } from 'lucide-react-native';
import { Text, YStack, Button } from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';

interface EmptyChartProps {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const BarChartIcon = BarChart2 as any;

/**
 * Premium empty state for charts with no data.
 * Shown when there are no expenses in the selected period.
 */
export const EmptyChart = memo(({
  title = 'No Data Yet',
  description = 'Add expenses to see your spending visualized here.',
  ctaLabel,
  onCta,
}: EmptyChartProps) => {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSecondary, borderColor: theme.colors.borderDefault }]}
      accessible={true}
      accessibilityLabel={title}
    >
      <YStack align="center" gap={3}>
        <View style={[styles.iconCircle, { backgroundColor: theme.colors.bgPrimary }]}>
          <BarChartIcon size={28} color={theme.colors.textTertiary} />
        </View>
        <YStack align="center" gap={1}>
          <Text variant="labelL" color="textSecondary" align="center">
            {title}
          </Text>
          <Text variant="bodyS" color="textTertiary" align="center">
            {description}
          </Text>
        </YStack>
        {ctaLabel && onCta && (
          <Button variant="outline" label={ctaLabel} onPress={onCta} size="sm" />
        )}
      </YStack>
    </View>
  );
});

EmptyChart.displayName = 'EmptyChart';

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
