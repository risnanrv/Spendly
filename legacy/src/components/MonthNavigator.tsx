import { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Card, XStack, Text } from './ui';
import { useTheme } from '@/hooks/useTheme';
import { getMonthName, getMonthStr } from '@/utils/date';

const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;

interface MonthNavigatorProps {
  monthStr: string;
  onChangeMonth: (monthStr: string) => void;
}

/**
 * Reusable MonthNavigator component for switching reporting periods.
 * Shared across Dashboard, Budget, and Reports screen layouts.
 */
export const MonthNavigator = memo(({ monthStr, onChangeMonth }: MonthNavigatorProps) => {
  const theme = useTheme();

  const handlePrevMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    onChangeMonth(getMonthStr(prev));
  };

  const handleNextMonth = () => {
    const [year, month] = monthStr.split('-').map(Number);
    const next = new Date(year, month, 1);
    onChangeMonth(getMonthStr(next));
  };

  return (
    <Card style={styles.monthNavCard}>
      <XStack justify="space-between" align="center">
        <Pressable
          onPress={handlePrevMonth}
          accessibilityLabel="Go to previous month"
          accessibilityRole="button"
          style={styles.monthNavBtn}
        >
          <ChevronLeftIcon size={20} color={theme.colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text variant="labelL" color="textPrimary">
          {getMonthName(monthStr)}
        </Text>
        <Pressable
          onPress={handleNextMonth}
          accessibilityLabel="Go to next month"
          accessibilityRole="button"
          style={styles.monthNavBtn}
        >
          <ChevronRightIcon size={20} color={theme.colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </XStack>
    </Card>
  );
});

MonthNavigator.displayName = 'MonthNavigator';

const styles = StyleSheet.create({
  monthNavCard: {
    padding: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  monthNavBtn: {
    padding: 4,
  },
});
