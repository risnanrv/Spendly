import { useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, RefreshControl, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  Screen,
  Text,
  Button,
  YStack,
  XStack,
  Card,
  Spacer,
  Spinner,
} from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useDashboard } from '@/hooks/useDashboard';
import { ExpenseCard } from '@/components/ExpenseCard';
import { useTheme } from '@/hooks/useTheme';
import { getMonthName, getGreeting, getTodayDateStr } from '@/utils/date';
import {
  AlertTriangle,
  FolderMinus,
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// Imported modular components
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { BudgetPreview } from '@/components/dashboard/BudgetPreview';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { TopCategoriesList } from '@/components/dashboard/TopCategoriesList';
import { MonthNavigator } from '@/components/MonthNavigator';

const AlertTriangleIcon = AlertTriangle as any;
const FolderMinusIcon = FolderMinus as any;

/**
 * Custom entrance animation wrapper
 */
const EntranceView = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 350 }));
  }, [delay, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle} accessibilityElementsHidden={false}>
      {children}
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  // Read/write from persistent Zustand store instead of local useState using optimized selectors
  const monthStr = useDashboardStore((state) => state.selectedMonth);
  const setSelectedMonth = useDashboardStore((state) => state.setSelectedMonth);

  const { data, isLoading, isRefetching, refetch, isError, error } = useDashboard(monthStr);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const greeting = useMemo(() => getGreeting(), []);
  const todayDateStr = useMemo(() => getTodayDateStr(), []);

  if (isLoading) {
    return (
      <Screen padded={false}>
        <YStack align="center" justify="center" style={styles.loadingWrapper}>
          <Spinner size="md" />
          <Spacer size={2} />
          <Text variant="bodyM" color="textSecondary">
            Loading dashboard data...
          </Text>
        </YStack>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen padded={false}>
        <YStack align="center" justify="center" style={styles.errorWrapper} gap={3}>
          <AlertTriangleIcon size={48} color={theme.colors.danger} />
          <Text variant="titleM" color="textPrimary">
            Failed to load dashboard
          </Text>
          <Text variant="bodyM" color="textSecondary" align="center" style={{ paddingHorizontal: 32 }}>
            {error?.message || 'Check database connection. The SQLite database is currently busy or unavailable.'}
          </Text>
          <Button variant="primary" label="Retry Reload" onPress={handleRefresh} />
        </YStack>
      </Screen>
    );
  }

  const dbData = data!;
  const hasExpenses = dbData.expenseCount > 0;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.bgPrimary }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[theme.colors.brandPrimary]}
            tintColor={theme.colors.brandPrimary}
          />
        }
      >
        {/* 1. Greeting Header Block */}
        <EntranceView delay={0}>
          <GreetingHeader
            todayDateStr={todayDateStr}
            greeting={greeting}
            userName={user?.name || 'Aman'}
            onSettingsPress={() => router.push('/(app)/settings')}
          />
        </EntranceView>

        {/* Month Navigation Control */}
        <EntranceView delay={50}>
          <MonthNavigator monthStr={monthStr} onChangeMonth={setSelectedMonth} />
        </EntranceView>

        {hasExpenses ? (
          <>
            {/* 2. Monthly Summary Card */}
            <EntranceView delay={100}>
              <SummaryCard
                totalSpent={dbData.totalSpent}
                averageDailySpend={dbData.averageDailySpend}
                expenseCount={dbData.expenseCount}
                highestExpenseAmount={dbData.highestExpense ? dbData.highestExpense.amount : 0}
                largestCategoryName={dbData.largestCategory ? dbData.largestCategory.name : 'None'}
              />
            </EntranceView>

            {/* 3. Monthly Budget Preview */}
            <EntranceView delay={150}>
              <BudgetPreview
                hasBudget={dbData.budgetPreview.hasBudget}
                budgetAmount={dbData.budgetPreview.budgetAmount}
                spent={dbData.budgetPreview.spent}
                remaining={dbData.budgetPreview.remaining}
                progress={dbData.budgetPreview.progress}
                status={dbData.budgetPreview.status}
                remainingDays={dbData.remainingDays}
                monthName={getMonthName(monthStr)}
              />
            </EntranceView>
          </>
        ) : (
          /* 7. Empty Dashboard View */
          <EntranceView delay={100}>
            <Card style={styles.emptyCard}>
              <YStack gap={4} align="center" style={{ width: '100%' }}>
                <View style={[styles.illustrationCircle, { backgroundColor: theme.colors.bgSecondary }]}>
                  <FolderMinusIcon size={40} color={theme.colors.brandPrimary} />
                </View>
                <YStack gap={1} align="center">
                  <Text variant="titleM" color="textPrimary">
                    No records this month
                  </Text>
                  <Text variant="bodyM" color="textSecondary" align="center" style={{ paddingHorizontal: 16 }}>
                    You haven't logged any expenses for {getMonthName(monthStr)} yet. Tap Add Expense below to begin.
                  </Text>
                </YStack>

                <YStack gap={2} style={{ width: '100%' }}>
                  <Button
                    variant="primary"
                    label="+ Add First Expense"
                    onPress={() => router.push('/(app)/expenses/new')}
                    fullWidth
                  />
                  <Button
                    variant="outline"
                    label="Learn How Spendly Works"
                    disabled={true}
                    onPress={() => {}}
                    fullWidth
                  />
                </YStack>
              </YStack>
            </Card>
          </EntranceView>
        )}

        {/* 4. Quick Actions Grid */}
        <EntranceView delay={200}>
          <QuickActions
            onAddExpensePress={() => router.push('/(app)/expenses/new')}
            onViewHistoryPress={() => router.push('/(app)/history')}
            onSetBudgetPress={() => router.push('/(app)/budget')}
          />
        </EntranceView>

        {hasExpenses ? (
          <>
            {/* 6. Monthly Spending By Category */}
            <EntranceView delay={250}>
              <TopCategoriesList topCategories={dbData.topCategories} />
            </EntranceView>

            {/* 5. Recent Expenses List */}
            <EntranceView delay={300}>
              <YStack gap={3}>
                <XStack justify="space-between" align="center" style={styles.sectionTitleRow}>
                  <Text variant="labelL" color="textPrimary">
                    Recent Expenses
                  </Text>
                  <Pressable onPress={() => router.push('/(app)/history')}>
                    <Text variant="bodyM" color="brandPrimary">
                      View All
                    </Text>
                  </Pressable>
                </XStack>

                <YStack gap={1}>
                  {dbData.recentExpenses.map((exp) => (
                    <ExpenseCard
                      key={exp.id}
                      title={exp.title}
                      note={exp.note}
                      amount={exp.amount}
                      categoryId={exp.categoryId}
                      date={new Date(exp.date)}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/expenses/[id]',
                          params: { id: exp.id },
                        })
                      }
                    />
                  ))}
                </YStack>
              </YStack>
            </EntranceView>
          </>
        ) : null}

        <Spacer size={4} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingWrapper: {
    flex: 1,
  },
  errorWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  illustrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionTitleRow: {
    marginBottom: 4,
    marginTop: 12,
  },
});
