/**
 * Component tests for ExpenseCard
 */
import { render, screen } from '@testing-library/react-native';
import { ExpenseCard } from '@/components/ExpenseCard';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#fff',
      bgCard: '#000',
      bgSecondary: '#111',
      brandPrimary: '#5B45E0',
      borderSubtle: '#333',
    },
  }),
}));

jest.mock('@/providers/ThemeProvider', () => ({
  useTheme: () => ({
    colors: {
      textPrimary: '#fff',
      bgCard: '#000',
      bgSecondary: '#111',
      brandPrimary: '#5B45E0',
      borderSubtle: '#333',
    },
  }),
}));

jest.mock('@/hooks/useExpenses', () => ({
  useCategories: () => ({
    data: [{ id: 'cat-1', name: 'Food', icon: 'HelpCircle', color: '#ff0000' }],
  }),
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: () => null,
  ChevronRight: () => null,
  HelpCircle: () => null,
}));

jest.mock('@/components/ui', () => {
  const { View, Text } = require('react-native');
  return {
    Card: ({ children, style }: any) => <View style={style}>{children}</View>,
    XStack: ({ children, style }: any) => <View style={style}>{children}</View>,
    YStack: ({ children, style }: any) => <View style={style}>{children}</View>,
    Text: ({ children, style, numberOfLines }: any) => (
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
    ),
    Skeleton: () => null,
    Button: ({ children, style }: any) => <View style={style}>{children}</View>,
    Badge: ({ children, style }: any) => <View style={style}>{children}</View>,
    Spinner: () => null,
    Screen: ({ children, style }: any) => <View style={style}>{children}</View>,
    Surface: ({ children, style }: any) => <View style={style}>{children}</View>,
    Center: ({ children, style }: any) => <View style={style}>{children}</View>,
    Container: ({ children, style }: any) => <View style={style}>{children}</View>,
    Divider: () => null,
  };
});

jest.mock('@/utils/currency', () => ({
  formatAmount: jest.fn(() => 'Rs. 100'),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultProps = {
  title: 'Test Expense',
  note: null,
  amount: 10000,
  categoryId: 'cat-1',
  date: new Date('2026-07-03T10:00:00'),
  onPress: jest.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ExpenseCard', () => {
  it('when loading=true, does NOT render the main title text (shows skeleton instead)', async () => {
    await render(
      <ExpenseCard {...defaultProps} loading={true} />
    );
    // Skeleton mock returns null so skeleton renders nothing; title must not appear
    expect(screen.queryByText('Test Expense')).toBeNull();
  });

  it('when loading=false, renders the expense title in the output', async () => {
    await render(
      <ExpenseCard {...defaultProps} loading={false} />
    );
    expect(screen.getByText('Test Expense')).toBeTruthy();
  });

  it('the Pressable has accessibilityRole="button"', async () => {
    await render(
      <ExpenseCard {...defaultProps} loading={false} />
    );
    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });

  it('shows note text when note prop is provided', async () => {
    await render(
      <ExpenseCard {...defaultProps} loading={false} note="Lunch with team" />
    );
    expect(screen.getByText('Lunch with team')).toBeTruthy();
  });

  it('does not show note text when note is null', async () => {
    await render(
      <ExpenseCard {...defaultProps} loading={false} note={null} />
    );
    expect(screen.queryByText('Lunch with team')).toBeNull();
  });
});
