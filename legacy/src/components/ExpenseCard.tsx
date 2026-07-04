import { memo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Card, Text, XStack, YStack, Skeleton } from './ui';
import * as Icons from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatAmount } from '@/utils/currency';
import { useCategories } from '@/hooks/useExpenses';

interface ExpenseCardProps {
  id?: string;
  title: string;
  note: string | null;
  amount: number; // Integer cents/paisa
  categoryId: string;
  date: Date;
  onPress?: () => void;
  loading?: boolean;
}

/**
 * Reusable ExpenseCard displaying category icon, title, optional note preview, amount, and formatted date time.
 * Supports active/pressed states, skeleton loading, and custom accessibility labels.
 */
export const ExpenseCard = memo(({
  title,
  note,
  amount,
  categoryId,
  date,
  onPress,
  loading = false,
}: ExpenseCardProps) => {
  const theme = useTheme();
  const { data: categories } = useCategories();

  if (loading) {
    return (
      <Card style={styles.card}>
        <XStack gap={3} align="center">
          <Skeleton radius="full" width={40} height={40} />
          <YStack gap={1.5} style={{ flex: 1 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </YStack>
          <Skeleton width="25%" height={20} />
        </XStack>
      </Card>
    );
  }

  // Find category details
  const category = (categories || []).find((c: any) => c.id === categoryId);
  const IconComponent = category ? ((Icons as any)[category.icon] || Icons.HelpCircle) : Icons.HelpCircle;
  const categoryColor = category?.color || '#818CF8';
  const categoryName = category?.name || 'Category';

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedAmount = formatAmount(amount);

  // Title fallback if empty or default 'Untitled'
  const trimmedTitle = (title || '').trim();
  const displayTitle = (trimmedTitle === '' || trimmedTitle.toLowerCase() === 'untitled') ? categoryName : trimmedTitle;

  // Accessibility label for screen readers
  const accessibilityLabel = `Expense transaction: ${displayTitle}. Category: ${categoryName}. Note: ${
    note || 'None'
  }. Amount: ${formattedAmount}. Logged at time: ${timeString}. Double tap to modify.`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to open transaction editor"
    >
      {({ pressed }) => (
        <Card
          style={[
            styles.card,
            {
              backgroundColor: pressed ? theme.colors.bgSecondary : theme.colors.bgCard,
              borderColor: pressed ? theme.colors.brandPrimary : theme.colors.borderSubtle,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <XStack gap={3} align="center">
            {/* 1. Category Icon Circle */}
            <View style={[styles.iconCircle, { backgroundColor: categoryColor }]}>
              <IconComponent size={20} color="#FFFFFF" strokeWidth={2} />
            </View>

            {/* 2. Text Details */}
            <YStack style={styles.textContainer} gap={1}>
              <Text variant="labelL" color="textPrimary" numberOfLines={1}>
                {displayTitle}
              </Text>
              
              {/* Optional note preview or time */}
              <XStack align="center" gap={1.5}>
                <Text variant="bodyS" color="textSecondary">
                  {timeString}
                </Text>
                {note ? (
                  <>
                    <Text variant="bodyS" color="textTertiary">•</Text>
                    <Text variant="bodyS" color="textSecondary" numberOfLines={1} style={styles.notePreview}>
                      {note}
                    </Text>
                  </>
                ) : null}
              </XStack>
            </YStack>

            {/* 3. Currency Amount */}
            <View style={styles.amountContainer}>
              <Text variant="titleS" color="textPrimary" align="right">
                {formattedAmount}
              </Text>
            </View>
          </XStack>
        </Card>
      )}
    </Pressable>
  );
});

ExpenseCard.displayName = 'ExpenseCard';

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderWidth: 1,
    marginVertical: 4,
    alignSelf: 'stretch',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  notePreview: {
    flex: 1,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
});
