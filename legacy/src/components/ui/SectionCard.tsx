import { View, Pressable, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from './Card';
import { Text } from './Text';
import { XStack } from './XStack';

interface SectionCardProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const SectionCard = ({
  title,
  actionLabel,
  onActionPress,
  children,
  style,
}: SectionCardProps) => {
  const theme = useTheme();

  return (
    <Card style={style}>
      <XStack justify="space-between" align="center" style={{ marginBottom: theme.spacing[4] }}>
        <Text variant="titleS" color="textPrimary">
          {title}
        </Text>
        {actionLabel && onActionPress ? (
          <Pressable
            onPress={onActionPress}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text variant="labelM" color="textBrand">
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </XStack>
      <View>{children}</View>
    </Card>
  );
};
