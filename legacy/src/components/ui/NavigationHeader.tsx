import React from 'react';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { XStack } from './XStack';
import { Text } from './Text';
import { IconButton } from './IconButton';
import { router } from 'expo-router';

interface NavigationHeaderProps {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
}

export const NavigationHeader = ({
  title,
  onBackPress,
  rightAction,
}: NavigationHeaderProps) => {
  const theme = useTheme();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <XStack
      justify="space-between"
      align="center"
      style={{
        height: 56,
        alignSelf: 'stretch',
        borderBottomWidth: theme.borders.width.thin,
        borderBottomColor: theme.colors.borderSubtle,
        paddingHorizontal: theme.layout.screenHorizontalPadding,
        backgroundColor: theme.colors.bgPrimary,
      }}
    >
      <XStack gap={2}>
        <IconButton
          icon={ChevronLeft}
          onPress={handleBack}
          size={24}
          color="textPrimary"
          accessibilityLabel="Go back"
        />
        <Text variant="titleS" color="textPrimary">
          {title}
        </Text>
      </XStack>
      {rightAction ? <XStack>{rightAction}</XStack> : null}
    </XStack>
  );
};
