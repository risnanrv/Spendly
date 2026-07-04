import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, XStack, YStack } from '../ui';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/currency';
import * as Icons from 'lucide-react-native';

const HelpCircleIcon = Icons.HelpCircle as any;

export interface TopCategory {
  categoryId: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  progress: number;
}

interface TopCategoriesListProps {
  topCategories: TopCategory[];
}

export const TopCategoriesList = memo(({ topCategories }: TopCategoriesListProps) => {
  const theme = useTheme();

  return (
    <YStack gap={3} style={styles.container}>
      <Text variant="labelL" color="textPrimary" style={styles.sectionTitle}>
        Where Money is Going
      </Text>
      <Card style={styles.categoriesCard}>
        <YStack gap={3}>
          {topCategories.map((cat) => {
            const IconComponent = (Icons as any)[cat.icon] || HelpCircleIcon;

            return (
              <YStack key={cat.categoryId} gap={1.5}>
                <XStack justify="space-between" align="center">
                  <XStack align="center" gap={2}>
                    <View style={[styles.miniIconCircle, { backgroundColor: cat.color }]}>
                      <IconComponent size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <Text variant="bodyM" color="textPrimary">
                      {cat.name}
                    </Text>
                  </XStack>
                  <XStack gap={1.5} align="baseline">
                    <Text variant="labelM" color="textPrimary">
                      {formatAmount(cat.amount)}
                    </Text>
                    <Text variant="bodyS" color="textSecondary">
                      ({cat.percentage}%)
                    </Text>
                  </XStack>
                </XStack>

                {/* Progress Line */}
                <View style={[styles.progressBarBg, { backgroundColor: theme.colors.borderSubtle }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${cat.progress * 100}%`,
                        backgroundColor: cat.color,
                      },
                    ]}
                  />
                </View>
              </YStack>
            );
          })}
        </YStack>
      </Card>
    </YStack>
  );
});

TopCategoriesList.displayName = 'TopCategoriesList';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 8,
  },
  categoriesCard: {
    padding: 16,
    marginBottom: 16,
  },
  miniIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
});
