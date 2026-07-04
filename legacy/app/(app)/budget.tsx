import { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView, Alert, Pressable } from 'react-native';
import {
  Screen,
  Text,
  Button,
  YStack,
  XStack,
  Card,
  Spacer,
  Spinner,
  NavigationHeader,
} from '@/components/ui';
import { useCurrentBudget, useSaveBudget, useDeleteBudget } from '@/hooks/useBudget';
import { BudgetPreview } from '@/components/dashboard/BudgetPreview';
import { BudgetForm } from '@/components/BudgetForm';
import { getMonthStr, getMonthName } from '@/utils/date';
import { useTheme } from '@/hooks/useTheme';
import {
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  Wallet,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const ChevronLeftIcon = ChevronLeft as any;
const ChevronRightIcon = ChevronRight as any;
const WalletIcon = Wallet as any;
const AlertOctagonIcon = AlertOctagon as any;

const EntranceView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.97);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [delay, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

/**
 * Budget Management Screen.
 * Dedicated screen allowing users to set, view, update, and remove monthly budget targets.
 */
export default function BudgetScreen() {
  const theme = useTheme();

  // Current month string parameter state
  const [monthStr, setMonthStr] = useState(getMonthStr(new Date()));
  const [isEditing, setIsEditing] = useState(false);

  // Queries & Mutations
  const { data: budgetData, isLoading, isError, error, refetch } = useCurrentBudget(monthStr);
  const saveBudgetMutation = useSaveBudget();
  const deleteBudgetMutation = useDeleteBudget();

  const handlePrevMonth = () => {
    setIsEditing(false);
    const [year, month] = monthStr.split('-').map(Number);
    const prev = new Date(year, month - 2, 1);
    setMonthStr(getMonthStr(prev));
  };

  const handleNextMonth = () => {
    setIsEditing(false);
    const [year, month] = monthStr.split('-').map(Number);
    const next = new Date(year, month, 1);
    setMonthStr(getMonthStr(next));
  };

  const handleSaveBudget = async (amountCents: number) => {
    try {
      await saveBudgetMutation.mutateAsync({ monthStr, amount: amountCents });
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert('Save Limit Failed', err?.message || 'Unable to update monthly budget limit.');
    }
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      'Remove Budget Limit',
      `Are you sure you want to delete the spending target limit for ${getMonthName(monthStr)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudgetMutation.mutateAsync(monthStr);
              setIsEditing(false);
            } catch (err: any) {
              Alert.alert('Delete Failed', err?.message || 'Unable to delete budget limit.');
            }
          },
        },
      ]
    );
  };

  const daysLeftInMonth = useMemo(() => {
    const today = new Date();
    const [year, month] = monthStr.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();
    const isCurrent = today.getFullYear() === year && (today.getMonth() + 1) === month;

    if (isCurrent) {
      return Math.max(0, totalDays - today.getDate());
    }
    const isPast = new Date(year, month - 1, 1) < new Date(today.getFullYear(), today.getMonth(), 1);
    return isPast ? 0 : totalDays;
  }, [monthStr]);

  if (isLoading) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Limit Configurations" />
        <YStack align="center" justify="center" style={styles.loadingWrapper}>
          <Spinner size="md" />
          <Spacer size={2} />
          <Text variant="bodyM" color="textSecondary">
            Loading budget metrics...
          </Text>
        </YStack>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Limit Configurations" />
        <YStack align="center" justify="center" style={styles.errorWrapper} gap={3}>
          <AlertOctagonIcon size={48} color={theme.colors.danger} />
          <Text variant="titleM" color="textPrimary">
            Fetch Error
          </Text>
          <Text variant="bodyM" color="textSecondary" align="center" style={{ paddingHorizontal: 32 }}>
            {error?.message || 'An unexpected DB exception occurred resolving target budgets.'}
          </Text>
          <Button variant="primary" label="Retry" onPress={() => refetch()} />
        </YStack>
      </Screen>
    );
  }

  const budget = budgetData!;
  const hasBudget = budget.budget > 0;

  return (
    <Screen padded={false}>
      <NavigationHeader title="Manage Budget" />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Month Selector Navigation */}
        <EntranceView delay={0}>
          <Card style={styles.monthNavCard}>
            <XStack justify="space-between" align="center">
              <Pressable
                onPress={handlePrevMonth}
                accessibilityLabel="Go to previous month"
                accessibilityRole="button"
                style={styles.monthNavBtn}
              >
                <ChevronLeftIcon size={20} color={theme.colors.textPrimary} />
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
                <ChevronRightIcon size={20} color={theme.colors.textPrimary} />
              </Pressable>
            </XStack>
          </Card>
        </EntranceView>

        {isEditing ? (
          <EntranceView delay={50}>
            <Card style={styles.formCard}>
              <YStack gap={2}>
                <Text variant="titleS" color="textPrimary">
                  {hasBudget ? 'Edit Target Limit' : 'Configure New Budget'}
                </Text>
                <Spacer size={1.5} />
                <BudgetForm
                  initialAmount={hasBudget ? budget.budget : undefined}
                  onSubmit={handleSaveBudget}
                  onCancel={() => setIsEditing(false)}
                  loading={saveBudgetMutation.isPending}
                />
              </YStack>
            </Card>
          </EntranceView>
        ) : (
          <>
            {/* Budget status preview block */}
            <EntranceView delay={50}>
              <BudgetPreview
                hasBudget={hasBudget}
                budgetAmount={budget.budget}
                spent={budget.spent}
                remaining={budget.remaining}
                progress={budget.percentage / 100}
                status={budget.status}
                remainingDays={daysLeftInMonth}
                monthName={getMonthName(monthStr)}
              />
            </EntranceView>

            {hasBudget ? (
              <EntranceView delay={100}>
                <YStack gap={2} style={styles.actionsBlock}>
                  <Button
                    variant="primary"
                    label="Edit Budget Limit"
                    onPress={() => setIsEditing(true)}
                    fullWidth
                  />
                  <Button
                    variant="outline"
                    label="Remove Budget Target"
                    onPress={handleDeleteBudget}
                    disabled={deleteBudgetMutation.isPending}
                    fullWidth
                  />
                </YStack>
              </EntranceView>
            ) : (
              /* Premium Empty Budget state */
              <EntranceView delay={100}>
                <Card style={styles.emptyCard}>
                  <YStack gap={4} align="center" style={{ width: '100%' }}>
                    <View style={[styles.illustrationCircle, { backgroundColor: theme.colors.bgSecondary }]}>
                      <WalletIcon size={40} color={theme.colors.brandPrimary} />
                    </View>
                    <YStack gap={1} align="center">
                      <Text variant="titleM" color="textPrimary">
                        No Budget Configured
                      </Text>
                      <Text variant="bodyM" color="textSecondary" align="center" style={{ paddingHorizontal: 16 }}>
                        You haven't set a budget for {getMonthName(monthStr)} yet. Build financial habits by target setting.
                      </Text>
                    </YStack>

                    <Button
                      variant="primary"
                      label="Set Monthly Budget"
                      onPress={() => setIsEditing(true)}
                      fullWidth
                      testID="budget-empty-state-cta"
                    />
                  </YStack>
                </Card>
              </EntranceView>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingWrapper: {
    flex: 1,
  },
  errorWrapper: {
    flex: 1,
  },
  monthNavCard: {
    padding: 12,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  monthNavBtn: {
    padding: 4,
  },
  formCard: {
    padding: 20,
    alignSelf: 'stretch',
  },
  actionsBlock: {
    width: '100%',
    marginTop: 8,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
