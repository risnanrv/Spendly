import type { LucideProps } from 'lucide-react-native';
import { YStack } from './YStack';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { Spacer } from './Spacer';

interface EmptyStateProps {
  icon: React.ComponentType<LucideProps>;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
}: EmptyStateProps) => {
  return (
    <YStack align="center" justify="center" gap={4} style={{ padding: 32, flex: 1 }}>
      <Icon name={icon} size="xl" color="textTertiary" />
      <YStack align="center" gap={1}>
        <Text variant="titleS" color="textPrimary" align="center">
          {title}
        </Text>
        <Text variant="bodyM" color="textSecondary" align="center">
          {description}
        </Text>
      </YStack>
      {actionLabel && onActionPress ? (
        <>
          <Spacer size={2} />
          <Button variant="secondary" label={actionLabel} onPress={onActionPress} />
        </>
      ) : null}
    </YStack>
  );
};
