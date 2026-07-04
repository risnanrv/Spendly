import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, Spacer, YStack } from '../ui';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/currency';
import { DollarSign, Activity, TrendingUp, Award } from 'lucide-react-native';

const DollarSignIcon = DollarSign as any;
const ActivityIcon = Activity as any;
const TrendingUpIcon = TrendingUp as any;
const AwardIcon = Award as any;

interface SummaryCardProps {
  totalSpent: number;
  averageDailySpend: number;
  expenseCount: number;
  highestExpenseAmount: number;
  largestCategoryName: string;
}

export const SummaryCard = memo(({
  totalSpent,
  averageDailySpend,
  expenseCount,
  highestExpenseAmount,
  largestCategoryName,
}: SummaryCardProps) => {
  const theme = useTheme();

  return (
    <Card style={[styles.summaryCard, { backgroundColor: theme.colors.brandPrimary }]}>
      <YStack gap={1.5}>
        <Text variant="labelS" color="textInverse" style={{ opacity: 0.85 }}>
          MONTHLY SPENDING
        </Text>
        <Text variant="displayL" color="textInverse" style={styles.totalText}>
          {formatAmount(totalSpent)}
        </Text>
      </YStack>

      <Spacer size={3} />

      {/* Sub statistics grid */}
      <View style={styles.statsGrid}>
        <View style={styles.gridCell}>
          <DollarSignIcon size={14} color="#FFF" style={{ opacity: 0.7 }} />
          <YStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="bodyS" color="textInverse" style={{ opacity: 0.75 }}>
              Daily Average
            </Text>
            <Text variant="labelL" color="textInverse">
              {formatAmount(averageDailySpend)}
            </Text>
          </YStack>
        </View>

        <View style={styles.gridCell}>
          <ActivityIcon size={14} color="#FFF" style={{ opacity: 0.7 }} />
          <YStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="bodyS" color="textInverse" style={{ opacity: 0.75 }}>
              Transactions
            </Text>
            <Text variant="labelL" color="textInverse">
              {expenseCount} items
            </Text>
          </YStack>
        </View>

        <View style={styles.gridCell}>
          <TrendingUpIcon size={14} color="#FFF" style={{ opacity: 0.7 }} />
          <YStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="bodyS" color="textInverse" style={{ opacity: 0.75 }}>
              Highest Single
            </Text>
            <Text variant="labelL" color="textInverse" numberOfLines={1}>
              {formatAmount(highestExpenseAmount)}
            </Text>
          </YStack>
        </View>

        <View style={styles.gridCell}>
          <AwardIcon size={14} color="#FFF" style={{ opacity: 0.7 }} />
          <YStack gap={0.5} style={{ flex: 1 }}>
            <Text variant="bodyS" color="textInverse" style={{ opacity: 0.75 }}>
              Top Category
            </Text>
            <Text variant="labelL" color="textInverse" numberOfLines={1}>
              {largestCategoryName}
            </Text>
          </YStack>
        </View>
      </View>
    </Card>
  );
});

SummaryCard.displayName = 'SummaryCard';

const styles = StyleSheet.create({
  summaryCard: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    borderRadius: 16,
    alignSelf: 'stretch',
  },
  totalText: {
    letterSpacing: -1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  gridCell: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    borderRadius: 8,
  },
});
