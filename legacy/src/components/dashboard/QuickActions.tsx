import { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { XStack, YStack, Text } from '../ui';
import { Plus, History, Sliders, BookOpen } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const PlusIcon = Plus as any;
const HistoryIcon = History as any;
const SlidersIcon = Sliders as any;
const BookOpenIcon = BookOpen as any;

interface QuickActionsProps {
  onAddExpensePress: () => void;
  onViewHistoryPress: () => void;
  onSetBudgetPress: () => void;
}

export const QuickActions = memo(({
  onAddExpensePress,
  onViewHistoryPress,
  onSetBudgetPress,
}: QuickActionsProps) => {
  const theme = useTheme();

  return (
    <YStack gap={2} style={styles.container}>
      <Text variant="labelL" color="textPrimary" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <XStack gap={2} wrap={true} style={styles.actionsRow}>
        <Pressable
          onPress={onAddExpensePress}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.bgCard,
              borderColor: pressed ? theme.colors.brandPrimary : theme.colors.borderSubtle,
            },
          ]}
        >
          <PlusIcon size={20} color={theme.colors.brandPrimary} />
          <Text variant="labelM" color="textPrimary">
            Add Expense
          </Text>
        </Pressable>

        <Pressable
          onPress={onViewHistoryPress}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.bgCard,
              borderColor: pressed ? theme.colors.brandPrimary : theme.colors.borderSubtle,
            },
          ]}
        >
          <HistoryIcon size={20} color={theme.colors.brandPrimary} />
          <Text variant="labelM" color="textPrimary">
            View Log
          </Text>
        </Pressable>

        <Pressable
          onPress={onSetBudgetPress}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.bgCard,
              borderColor: pressed ? theme.colors.brandPrimary : theme.colors.borderSubtle,
            },
          ]}
        >
          <SlidersIcon size={20} color={theme.colors.brandPrimary} />
          <Text variant="labelM" color="textPrimary">
            Set Budget
          </Text>
        </Pressable>

        <Pressable
          disabled={true}
          style={[styles.actionButton, styles.disabledAction, { backgroundColor: theme.colors.bgCard }]}
        >
          <BookOpenIcon size={20} color={theme.colors.textTertiary} />
          <Text variant="labelM" color="textTertiary">
            Reports
          </Text>
        </Pressable>
      </XStack>
    </YStack>
  );
});

QuickActions.displayName = 'QuickActions';

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    marginBottom: 8,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    width: '48%',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  disabledAction: {
    opacity: 0.5,
  },
});
