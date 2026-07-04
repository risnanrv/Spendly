import { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Animated } from 'react-native';
import {
  Screen,
  Text,
  YStack,
  XStack,
  Card,
  Spacer,
  NavigationHeader,
  Skeleton,
  Badge,
  Button,
} from '@/components/ui';
import { PieChart, LineChart, BarChart, EmptyChart } from '@/components/charts';
import { MonthNavigator } from '@/components/MonthNavigator';
import { useMonthlyReport, useMonthComparison } from '@/hooks/useReports';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardStore } from '@/stores/dashboard.store';
import { formatAmount, formatAmountCompact } from '@/utils/currency';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import type { BudgetContext } from '@/services/AnalyticsService';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Minus,
  Calendar,
  BarChart2,
  Sun,
  Briefcase,
} from 'lucide-react-native';

// ─── Typed icon component declarations ───────────────────────────────────────

const TrendingUpIcon = TrendingUp as any;
const TrendingDownIcon = TrendingDown as any;

// ─── Icon map for insight cards ───────────────────────────────────────────────

const IconMap: Record<string, any> = {
  AlertTriangle: AlertTriangle,
  TrendingUp: TrendingUp,
  TrendingDown: TrendingDown,
  CheckCircle: CheckCircle,
  Calendar: Calendar,
  BarChart2: BarChart2,
  Sun: Sun,
  Briefcase: Briefcase,
  Info: Info,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryMetricCard = memo(({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <Card style={styles.metricCard}>
    <Text variant="labelS" color="textSecondary" numberOfLines={1}>
      {label}
    </Text>
    <Spacer size={1} />
    <Text
      variant="titleL"
      {...(color ? {} : { color: 'textPrimary' })}
      numberOfLines={1}
      style={color ? { color } : {}}
    >
      {value}
    </Text>
    {sub && (
      <Text variant="bodyS" color="textTertiary" numberOfLines={1}>
        {sub}
      </Text>
    )}
  </Card>
));

SummaryMetricCard.displayName = 'SummaryMetricCard';

const InsightCard = memo(({
  type,
  title,
  message,
  icon,
  value,
}: {
  type: 'warning' | 'info' | 'success' | 'neutral';
  title: string;
  message: string;
  icon?: string;
  value?: string;
}) => {
  const theme = useTheme();
  const iconColorMap = {
    warning: theme.colors.warning,
    info: theme.colors.info,
    success: theme.colors.success,
    neutral: theme.colors.textSecondary,
  };
  const bgColorMap = {
    warning: theme.colors.warningBg,
    info: theme.colors.infoBg,
    success: theme.colors.successBg,
    neutral: theme.colors.bgSecondary,
  };

  const iconColor = iconColorMap[type];
  const bgColor = bgColorMap[type];

  const IconComponent = icon ? IconMap[icon] : Info;
  const FinalIcon = (IconComponent ?? Info) as any;

  return (
    <Card style={[styles.insightCard, { backgroundColor: bgColor }]}>
      <XStack gap={3} align="flex-start">
        <View style={[styles.insightIcon, { backgroundColor: theme.colors.bgCard }]}>
          <FinalIcon size={16} color={iconColor} />
        </View>
        <YStack style={styles.insightContent} gap={1}>
          <XStack justify="space-between" align="center">
            <Text variant="labelM" color="textPrimary" style={styles.insightTitle}>
              {title}
            </Text>
            {value && (
              <Text variant="labelM" style={{ color: iconColor }}>
                {value}
              </Text>
            )}
          </XStack>
          <Text variant="bodyS" color="textSecondary">
            {message}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );
});

InsightCard.displayName = 'InsightCard';

const ComparisonRow = memo(({
  label,
  currentAmount,
  prevAmount,
}: { label: string; currentAmount: number; prevAmount: number }) => {
  const theme = useTheme();
  const diff = currentAmount - prevAmount;
  const pct = prevAmount > 0 ? Math.round(Math.abs(diff / prevAmount) * 100) : 0;
  const isMore = diff > 0;
  const TIcon = (isMore ? TrendingUp : diff < 0 ? TrendingDown : Minus) as any;
  const tColor = isMore ? theme.colors.danger : diff < 0 ? theme.colors.success : theme.colors.textSecondary;

  return (
    <XStack justify="space-between" align="center" style={styles.compRow}>
      <Text variant="bodyS" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant="labelM" color="textPrimary">
        {formatAmount(currentAmount)}
      </Text>
      <XStack gap={1} align="center" style={styles.compChange}>
        <TIcon size={12} color={tColor} />
        <Text variant="bodyS" style={{ color: tColor }}>
          {pct}%
        </Text>
      </XStack>
    </XStack>
  );
});

ComparisonRow.displayName = 'ComparisonRow';

const CategoryLegendRow = memo(({ name, color, amount, percentage }: { name: string; icon?: string; color: string; amount: number; percentage: number }) => (
  <XStack justify="space-between" align="center" style={styles.catRow}>
    <XStack gap={2} align="center" style={{ flex: 1 }}>
      <View style={[styles.catDot, { backgroundColor: color }]} />
      <Text variant="bodyS" color="textPrimary" numberOfLines={1} style={{ flex: 1 }}>
        {name}
      </Text>
    </XStack>
    <XStack gap={3} align="center">
      <Text variant="labelM" color="textPrimary">{formatAmountCompact(amount)}</Text>
      <Badge
        label={`${percentage}%`}
        variant="neutral"
        style={{ minWidth: 40, alignItems: 'center' }}
      />
    </XStack>
  </XStack>
));

CategoryLegendRow.displayName = 'CategoryLegendRow';

// ─── Reports Screen ───────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const theme = useTheme();
  const selectedMonth = useDashboardStore((state) => state.selectedMonth);
  const setSelectedMonth = useDashboardStore((state) => state.setSelectedMonth);

  // Allow reports to use the shared dashboard month state
  const monthStr = selectedMonth;

  const { data: report, isLoading, isRefetching, refetch, isError, error } = useMonthlyReport(monthStr);
  const { data: comparison, isLoading: compLoading } = useMonthComparison(monthStr);
  const { data: dashData } = useDashboard(monthStr);

  // Build budget context from dashboard data for analytics
  const budgetCtx: BudgetContext = useMemo(() => {
    const bp = dashData?.budgetPreview;
    return {
      hasBudget: bp?.hasBudget ?? false,
      budgetAmount: bp?.budgetAmount ?? 0,
      spent: bp?.spent ?? 0,
      remaining: bp?.remaining ?? 0,
      remainingDays: dashData?.remainingDays ?? 0,
      status: (bp?.status === 'none' ? 'safe' : bp?.status) ?? 'safe',
    };
  }, [dashData]);

  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics(monthStr, budgetCtx);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0.4);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [monthStr, fadeAnim]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Pie chart data from category breakdown
  const pieData = useMemo(() => {
    if (!report?.categoryBreakdown?.length) return [];
    const chartColors = [
      theme.colors.chart1,
      theme.colors.chart2,
      theme.colors.chart3,
      theme.colors.chart4,
      theme.colors.chart5,
    ];
    return report.categoryBreakdown.slice(0, 5).map((cat, i) => ({
      value: cat.amount / 100,
      label: cat.name,
      color: cat.color || chartColors[i % chartColors.length],
    }));
  }, [report, theme]);

  // Line chart data for daily trend
  const lineData = useMemo(() => {
    if (!report?.dailyTrend?.length) return [];
    return report.dailyTrend.map((d) => ({
      value: d.amount,
      label: d.label,
    }));
  }, [report]);

  // Bar chart data for category comparison
  const barData = useMemo(() => {
    if (!report?.categoryBreakdown?.length) return [];
    const chartColors = [
      theme.colors.chart1,
      theme.colors.chart2,
      theme.colors.chart3,
      theme.colors.chart4,
      theme.colors.chart5,
    ];
    return report.categoryBreakdown.slice(0, 5).map((cat, i) => ({
      value: cat.amount,
      label: cat.name.slice(0, 6),
      frontColor: cat.color || chartColors[i % chartColors.length],
    }));
  }, [report, theme]);

  if (isError) {
    return (
      <Screen padded={false}>
        <NavigationHeader title="Reports & Insights" />
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <YStack align="center" gap={4} style={{ padding: 24 }}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.dangerBg }]}>
                <AlertTriangle size={48} color={theme.colors.danger} />
              </View>
              <Text variant="titleM" color="textPrimary" align="center">
                Failed to Load Reports
              </Text>
              <Text variant="bodyM" color="textSecondary" align="center">
                {(error as any)?.message || 'An error occurred while compiling your financial summary.'}
              </Text>
              <Spacer size={3} />
              <Button
                variant="primary"
                label="Retry"
                onPress={handleRefresh}
                style={styles.addBtn}
              />
            </YStack>
          </Card>
        </View>
      </Screen>
    );
  }

  const hasData = (report?.summary.transactionCount ?? 0) > 0;

  return (
    <Screen padded={false}>
      <NavigationHeader title="Reports & Insights" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.brandPrimary}
          />
        }
      >
        {/* Month Selector */}
        <View style={styles.section}>
          <MonthNavigator monthStr={monthStr} onChangeMonth={setSelectedMonth} />
        </View>

        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
          {!isLoading && !hasData ? (
            <View style={styles.emptyContainer}>
              <Card style={styles.emptyCard}>
                <YStack align="center" gap={4} style={{ padding: 24 }}>
                  <View style={styles.emptyIconContainer}>
                    <Calendar size={48} color={theme.colors.brandPrimary} />
                  </View>
                  <Text variant="titleM" color="textPrimary" align="center">
                    No Expenses Recorded
                  </Text>
                  <Text variant="bodyM" color="textSecondary" align="center">
                    We couldn't find any transactions logged for {report?.monthStr || monthStr}. Start logging your purchases to unlock visual spending trends, category comparison columns, and side-by-side month insights.
                  </Text>
                  <Spacer size={3} />
                  <Button
                    variant="primary"
                    label="Log First Expense"
                    onPress={() => router.push('/')}
                    style={styles.addBtn}
                  />
                </YStack>
              </Card>
            </View>
          ) : (
            <>
              {/* Summary Cards */}
              <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Summary
          </Text>
          {isLoading ? (
            <View style={styles.metricsGrid}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} width="48%" height={80} />
              ))}
            </View>
          ) : (
            <View style={styles.metricsGrid}>
              <SummaryMetricCard
                label="Total Spent"
                value={formatAmountCompact(report?.summary.totalExpense ?? 0)}
                sub={`${report?.summary.transactionCount ?? 0} transactions`}
                color={theme.colors.danger}
              />
              <SummaryMetricCard
                label="Avg. Transaction"
                value={formatAmountCompact(report?.summary.averageTransaction ?? 0)}
                sub="per expense"
              />
              <SummaryMetricCard
                label="Largest Expense"
                value={formatAmountCompact(report?.summary.largestExpense ?? 0)}
                color={theme.colors.warning}
              />
              <SummaryMetricCard
                label="Daily Avg."
                value={formatAmountCompact(report?.summary.averageDailySpending ?? 0)}
                sub="per active day"
              />
            </View>
          )}
        </View>

        {/* Category Pie Chart */}
        <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Category Distribution
          </Text>
          <Card style={styles.chartCard}>
            {isLoading ? (
              <Skeleton width="100%" height={180} />
            ) : hasData && pieData.length > 0 ? (
              <YStack align="center" gap={4}>
                <PieChart
                  data={pieData}
                  size={180}
                  innerRadius={58}
                  label={formatAmountCompact(report!.summary.totalExpense)}
                  subLabel="total spent"
                  accessibilityLabel="Category spending distribution pie chart"
                />
                {/* Category legend */}
                <YStack style={styles.legendContainer} gap={2}>
                  {report?.categoryBreakdown.slice(0, 5).map((cat, i) => {
                    const chartColors = [
                      theme.colors.chart1, theme.colors.chart2,
                      theme.colors.chart3, theme.colors.chart4, theme.colors.chart5,
                    ];
                    return (
                      <CategoryLegendRow
                        key={cat.categoryId}
                        name={cat.name}
                        icon={cat.icon}
                        color={cat.color || chartColors[i % chartColors.length]}
                        amount={cat.amount}
                        percentage={cat.percentage}
                      />
                    );
                  })}
                </YStack>
              </YStack>
            ) : (
              <EmptyChart
                title="No Spending Data"
                description="Log expenses to see your category distribution here."
              />
            )}
          </Card>
        </View>

        {/* Daily Spending Trend */}
        <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Daily Spending Trend
          </Text>
          <Card style={styles.chartCard}>
            {isLoading ? (
              <Skeleton width="100%" height={160} />
            ) : hasData && lineData.length > 0 ? (
              <LineChart
                data={lineData}
                color={theme.colors.brandPrimary}
                height={160}
                curved
                accessibilityLabel="Daily spending trend line chart"
              />
            ) : (
              <EmptyChart
                title="No Trend Data"
                description="Spending trend will appear after you log expenses."
              />
            )}
          </Card>
        </View>

        {/* Category Bar Chart */}
        <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Category Comparison
          </Text>
          <Card style={styles.chartCard}>
            {isLoading ? (
              <Skeleton width="100%" height={160} />
            ) : hasData && barData.length > 0 ? (
              <BarChart
                data={barData}
                height={160}
                barWidth={28}
                spacing={16}
                accessibilityLabel="Category spending bar chart"
              />
            ) : (
              <EmptyChart
                title="No Category Data"
                description="Category bar chart appears after adding expenses."
              />
            )}
          </Card>
        </View>

        {/* Month Comparison */}
        <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Month Comparison
          </Text>
          <Card style={styles.compCard}>
            {compLoading ? (
              <YStack gap={2}>
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} width="100%" height={32} radius="sm" />
                ))}
              </YStack>
            ) : comparison ? (
              <YStack gap={2}>
                <XStack justify="space-between" align="center" style={styles.compHeader}>
                  <Text variant="bodyS" color="textTertiary">
                    {comparison.previous.monthStr}
                  </Text>
                  <Text variant="bodyS" color="textTertiary">
                    {comparison.current.monthStr}
                  </Text>
                </XStack>
                <ComparisonRow
                  label="Total Spending"
                  currentAmount={comparison.current.summary.totalExpense}
                  prevAmount={comparison.previous.summary.totalExpense}
                />
                <ComparisonRow
                  label="Transactions"
                  currentAmount={comparison.current.summary.transactionCount}
                  prevAmount={comparison.previous.summary.transactionCount}
                />
                <ComparisonRow
                  label="Avg. per Transaction"
                  currentAmount={comparison.current.summary.averageTransaction}
                  prevAmount={comparison.previous.summary.averageTransaction}
                />

                {/* Net change banner */}
                <View style={[
                  styles.netChangeBanner,
                  {
                    backgroundColor: comparison.isIncrease
                      ? theme.colors.dangerBg
                      : theme.colors.successBg,
                  },
                ]}>
                  <XStack gap={2} align="center" justify="center">
                    {comparison.isIncrease
                      ? <TrendingUpIcon size={14} color={theme.colors.danger} />
                      : <TrendingDownIcon size={14} color={theme.colors.success} />
                    }
                    <Text
                      variant="labelM"
                      style={{
                        color: comparison.isIncrease ? theme.colors.danger : theme.colors.success,
                      }}
                    >
                      {comparison.isIncrease ? '+' : '-'}{comparison.percentageChange}% vs last month
                    </Text>
                  </XStack>
                </View>
              </YStack>
            ) : (
              <Text variant="bodyS" color="textSecondary" align="center">
                No comparison data available.
              </Text>
            )}
          </Card>
        </View>

        {/* Smart Insights */}
        <View style={styles.section}>
          <Text variant="titleS" color="textPrimary" style={styles.sectionTitle}>
            Smart Insights
          </Text>
          {analyticsLoading ? (
            <YStack gap={2}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} width="100%" height={72} />
              ))}
            </YStack>
          ) : analyticsData && analyticsData.insights.length > 0 ? (
            <YStack gap={2}>
              {analyticsData.insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  type={insight.type}
                  title={insight.title}
                  message={insight.message}
                  {...(insight.icon !== undefined ? { icon: insight.icon } : {})}
                  {...(insight.value !== undefined ? { value: insight.value } : {})}
                />
              ))}
            </YStack>
          ) : (
            <EmptyChart
              title="No Insights Yet"
              description="Add more transactions to unlock personalized spending insights."
            />
          )}
        </View>
            </>
          )}
        </Animated.View>

        <Spacer size={6} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    padding: 14,
  },
  chartCard: {
    padding: 16,
    overflow: 'hidden',
  },
  compCard: {
    padding: 16,
  },
  compHeader: {
    marginBottom: 4,
  },
  compRow: {
    paddingVertical: 6,
  },
  compChange: {
    minWidth: 52,
    justifyContent: 'flex-end',
  },
  netChangeBanner: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  insightCard: {
    padding: 14,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    flex: 1,
  },
  legendContainer: {
    width: '100%',
  },
  catRow: {
    paddingVertical: 4,
  },
  catDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  emptyCard: {
    paddingVertical: 12,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addBtn: {
    minWidth: 160,
  },
});
