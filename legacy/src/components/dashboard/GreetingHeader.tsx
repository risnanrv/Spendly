import { memo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { XStack, YStack, Text } from '../ui';
import { Settings } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const SettingsIcon = Settings as any;

interface GreetingHeaderProps {
  todayDateStr: string;
  greeting: string;
  userName: string;
  onSettingsPress: () => void;
}

export const GreetingHeader = memo(({
  todayDateStr,
  greeting,
  userName,
  onSettingsPress,
}: GreetingHeaderProps) => {
  const theme = useTheme();

  return (
    <XStack justify="space-between" align="center" style={styles.headerBlock}>
      <YStack gap={1}>
        <Text variant="bodyS" color="textSecondary">
          {todayDateStr}
        </Text>
        <Text variant="titleL" color="textPrimary">
          {greeting}, {userName}
        </Text>
      </YStack>
      <Pressable
        onPress={onSettingsPress}
        accessibilityLabel="Settings tab shortcut"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: pressed ? theme.colors.bgSecondary : theme.colors.bgCard,
            borderColor: theme.colors.borderSubtle,
          },
        ]}
      >
        <SettingsIcon size={20} color={theme.colors.textPrimary} strokeWidth={1.5} />
      </Pressable>
    </XStack>
  );
});

GreetingHeader.displayName = 'GreetingHeader';

const styles = StyleSheet.create({
  headerBlock: {
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
