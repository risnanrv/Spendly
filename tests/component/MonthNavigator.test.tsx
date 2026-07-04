/**
 * Component tests for MonthNavigator
 */
import { render, fireEvent, screen } from '@testing-library/react-native';
import { MonthNavigator } from '@/components/MonthNavigator';

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
    Text: ({ children, style }: any) => <Text style={style}>{children}</Text>,
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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MonthNavigator', () => {
  const monthStr = '2026-07';
  let onChangeMonth: jest.Mock;

  beforeEach(() => {
    onChangeMonth = jest.fn();
  });

  it('renders the current month name in the output', async () => {
    await render(
      <MonthNavigator monthStr={monthStr} onChangeMonth={onChangeMonth} />
    );
    // getMonthName('2026-07') → 'July 2026' (en-IN locale)
    const monthText = screen.getByText(/July.*2026|2026.*July/i);
    expect(monthText).toBeTruthy();
  });

  it('calls onChangeMonth with previous month string when left arrow is pressed', async () => {
    await render(
      <MonthNavigator monthStr={monthStr} onChangeMonth={onChangeMonth} />
    );
    const prevButton = screen.getByLabelText('Go to previous month');
    fireEvent.press(prevButton);
    // 2026-07 previous month → 2026-06
    expect(onChangeMonth).toHaveBeenCalledWith('2026-06');
  });

  it('calls onChangeMonth with next month string when right arrow is pressed', async () => {
    await render(
      <MonthNavigator monthStr={monthStr} onChangeMonth={onChangeMonth} />
    );
    const nextButton = screen.getByLabelText('Go to next month');
    fireEvent.press(nextButton);
    // 2026-07 next month → 2026-08
    expect(onChangeMonth).toHaveBeenCalledWith('2026-08');
  });

  it('both nav buttons have accessibilityRole="button"', async () => {
    await render(
      <MonthNavigator monthStr={monthStr} onChangeMonth={onChangeMonth} />
    );
    const prevButton = screen.getByLabelText('Go to previous month');
    const nextButton = screen.getByLabelText('Go to next month');
    expect(prevButton.props.accessibilityRole).toBe('button');
    expect(nextButton.props.accessibilityRole).toBe('button');
  });
});
