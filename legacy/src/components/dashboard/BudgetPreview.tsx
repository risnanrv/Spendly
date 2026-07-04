import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, XStack, YStack } from '../ui';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/currency';

interface BudgetPreviewProps {
  hasBudget: boolean;
  budgetAmount: number;
  spent: number;
  remaining: number;
  progress: number; // 0 to 1
  status: 'safe' | 'approaching' | 'exceeded' | 'none';
  remainingDays: number;
  monthName: string;
}

/**
 * Reusable BudgetPreview component shared between Dashboard and Budget detail screens.
 * Fully formatted with design system semantic colors and progress lines.
 */
export const BudgetPreview = memo(({
  hasBudget,
  budgetAmount,
  spent,
  remaining,
  progress,
  status,
  remainingDays,
  monthName,
}: BudgetPreviewProps) => {
  const theme = useTheme();

  return (
    <Card style={styles.budgetCard}>
      <YStack gap={2}>
        <XStack justify="space-between" align="center">
          <Text variant="labelL" color="textPrimary">
            Monthly Budget
          </Text>
          {hasBudget ? (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    status === 'exceeded'
                      ? theme.colors.dangerBg
                      : status === 'approaching'
                      ? theme.colors.warningBg
                      : theme.colors.successBg,
                },
              ]}
            >
              <Text
                variant="labelS"
                color={
                  status === 'exceeded'
                    ? 'danger'
                    : status === 'approaching'
                    ? 'warning'
                    : 'success'
                }
              >
                {status.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </XStack>

        {hasBudget ? (
          <YStack gap={2}>
            <XStack justify="space-between" align="baseline">
              <XStack align="baseline" gap={1}>
                <Text variant="titleS" color="textPrimary">
                  {formatAmount(spent)}
                </Text>
                <Text variant="bodyS" color="textSecondary">
                  spent of {formatAmount(budgetAmount)}
                </Text>
              </XStack>
              <Text variant="bodyS" color="textSecondary">
                {remainingDays} days left
              </Text>
            </XStack>

            {/* Progress Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.borderSubtle }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(100, progress * 100)}%`,
                    backgroundColor:
                      status === 'exceeded'
                        ? theme.colors.danger
                        : status === 'approaching'
                        ? theme.colors.warning
                        : theme.colors.brandPrimary,
                  },
                ]}
              />
            </View>

            <Text variant="bodyS" color="textSecondary">
              Remaining: {formatAmount(remaining)}
            </Text>
          </YStack>
        ) : (
          <YStack gap={1.5} align="center" style={styles.emptyBudgetInner}>
            <Text variant="bodyM" color="textSecondary" align="center">
              No monthly budget configured for {monthName}.
            </Text>
            <Text variant="bodyS" color="textTertiary" align="center">
              Set target budget limits to monitor spending.
            </Text>
          </YStack>
        )}
      </YStack>
    </Card>
  );
});

BudgetPreview.displayName = 'BudgetPreview';

const styles = StyleSheet.create({
  budgetCard: {
    padding: 16,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyBudgetInner: {
    paddingVertical: 12,
  },
});
