import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StyleSheet, View, RefreshControl, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useExpensesInfinite, usePrefetchExpense } from '@/hooks/useExpenses';
import { useHistoryStateStore } from '@/stores/historyState.store';
import {
  Screen,
  Text,
  SearchInput,
  XStack,
  YStack,
  EmptyState,
  NavigationHeader,
  Button,
  Chip,
} from '@/components/ui';
import { ExpenseCard } from '@/components/ExpenseCard';
import { formatRelativeDate } from '@/utils/date';
import type { Expense } from '@/models/domain';
import { CalendarDays, WifiOff, FileSearch } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const FlashListCast = FlashList as any;

interface HeaderItem {
  type: 'header';
  title: string;
}

interface ExpenseItem {
  type: 'item';
  expense: Expense;
}

type ListItem = HeaderItem | ExpenseItem;

/**
 * Expense History Screen.
 * Replaces the placeholder. Displays transaction card items with infinite scroll,
 * debounced search, pull-to-refresh, filters, and sticky date headers.
 */
export default function HistoryScreen() {
  const theme = useTheme();
  const prefetchExpense = usePrefetchExpense();

  // Read search & scroll state from Zustand store for persistent state
  const {
    searchQuery,
    selectedFilter,
    scrollOffset,
    setSearchQuery,
    setSelectedFilter,
    setScrollOffset,
  } = useHistoryStateStore();

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const flashListRef = useRef<any>(null);

  // Debounce Search input (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Infinite List Query
  const {
    data,
    isLoading,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isError,
    error,
  } = useExpensesInfinite({
    filter: selectedFilter,
    search: debouncedSearch,
    limit: 20,
  });

  // Prefetch details on hover / press start
  const handlePressIn = useCallback((id: string) => {
    prefetchExpense(id);
  }, [prefetchExpense]);

  const handleCardPress = useCallback((id: string) => {
    router.push({
      pathname: '/(app)/expenses/[id]',
      params: { id },
    });
  }, []);

  // Pull to refresh action
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Load next page
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten and group entries by date relative headers
  const listData = useMemo(() => {
    if (!data?.pages) return [];
    
    const flattened = data.pages.flat();
    const result: ListItem[] = [];
    let lastDateStr = '';

    flattened.forEach((expense) => {
      const dateStr = formatRelativeDate(expense.date);
      if (dateStr !== lastDateStr) {
        result.push({ type: 'header', title: dateStr });
        lastDateStr = dateStr;
      }
      result.push({ type: 'item', expense });
    });

    return result;
  }, [data]);

  // FlashList estimation item size callback
  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.headerContainer, { backgroundColor: theme.colors.bgPrimary }]}>
            <Text variant="labelS" color="textSecondary" style={styles.headerText}>
              {item.title.toUpperCase()}
            </Text>
          </View>
        );
      }

      const { expense } = item;
      return (
        <Pressable
          onPressIn={() => handlePressIn(expense.id)}
          style={styles.cardPressable}
        >
          <ExpenseCard
            title={expense.title}
            note={expense.note}
            amount={expense.amount}
            categoryId={expense.categoryId}
            date={expense.date}
            onPress={() => handleCardPress(expense.id)}
          />
        </Pressable>
      );
    },
    [theme, handlePressIn, handleCardPress]
  );

  const stickyHeaderIndices = useMemo(() => {
    return listData
      .map((item, idx) => (item.type === 'header' ? idx : -1))
      .filter((idx) => idx !== -1);
  }, [listData]);

  // Loading Skeletons list
  const skeletonData = useMemo(() => Array.from({ length: 6 }), []);

  // Restore scroll position on load
  useEffect(() => {
    let timer: any = null;
    if (flashListRef.current && scrollOffset > 0 && listData.length > 0) {
      timer = setTimeout(() => {
        flashListRef.current.scrollToOffset({ offset: scrollOffset, animated: false });
      }, 100);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [scrollOffset, listData.length]);

  return (
    <Screen padded={false}>
      <NavigationHeader title="Transaction Log" />

      {/* Floating Add Expense shortcut button */}
      <View style={styles.fabContainer}>
        <Button
          variant="primary"
          label="+ Add Expense"
          onPress={() => router.push('/(app)/expenses/new')}
          style={styles.fab}
          testID="history-fab"
        />
      </View>

      <YStack gap={3} style={styles.container}>
        {/* Search Panel */}
        <SearchInput
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Quick Date Filters row */}
        <XStack gap={2} style={styles.filterRow}>
          {(['all', 'today', 'week', 'month'] as const).map((filterOpt) => (
            <Chip
              key={filterOpt}
              label={filterOpt === 'all' ? 'All Time' : filterOpt.charAt(0).toUpperCase() + filterOpt.slice(1)}
              selected={selectedFilter === filterOpt}
              onPress={() => setSelectedFilter(filterOpt)}
            />
          ))}
        </XStack>

        {/* Content list block */}
        <View style={styles.listWrapper}>
          {isLoading ? (
            <FlashListCast
              data={skeletonData}
              renderItem={() => <ExpenseCard title="" note="" amount={0} categoryId="" date={new Date()} loading={true} />}
              estimatedItemSize={72}
            />
          ) : isError ? (
            <EmptyState
              icon={WifiOff}
              title="Query Fetch Failed"
              description={error?.message || 'We could not fetch your expenses from storage.'}
              actionLabel="Retry Reload"
              onActionPress={handleRefresh}
            />
          ) : listData.length === 0 ? (
            debouncedSearch ? (
              <EmptyState
                icon={FileSearch}
                title="No Matching Results"
                description={`We couldn't find any expenses matching "${debouncedSearch}".`}
                actionLabel="Clear Search"
                onActionPress={() => setSearchQuery('')}
              />
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No Expenses Tracked"
                description="Your transaction log is empty. Tap Add Expense to record one."
                actionLabel="Create Expense"
                onActionPress={() => router.push('/(app)/expenses/new')}
              />
            )
          ) : (
            <FlashListCast
              ref={flashListRef}
              data={listData}
              renderItem={renderItem}
              getItemType={(item: ListItem) => item.type}
              stickyHeaderIndices={stickyHeaderIndices}
              estimatedItemSize={72}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              onScroll={(e: any) => setScrollOffset(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={handleRefresh}
                  colors={[theme.colors.brandPrimary]}
                  tintColor={theme.colors.brandPrimary}
                />
              }
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.footerLoader}>
                    <Text variant="bodyS" color="textSecondary">
                      Loading older transactions...
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flex: 1,
  },
  filterRow: {
    paddingBottom: 4,
  },
  listWrapper: {
    flex: 1,
  },
  headerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: 'stretch',
    zIndex: 10,
  },
  headerText: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  cardPressable: {
    alignSelf: 'stretch',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 99,
  },
  fab: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    paddingHorizontal: 20,
    height: 48,
  },
});
