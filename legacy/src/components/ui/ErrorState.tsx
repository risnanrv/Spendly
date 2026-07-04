import { AlertCircle } from 'lucide-react-native';
import { YStack } from './YStack';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { Spacer } from './Spacer';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) => {
  return (
    <YStack align="center" justify="center" gap={4} style={{ padding: 32, flex: 1 }}>
      <Icon name={AlertCircle} size="xl" color="danger" />
      <YStack align="center" gap={1}>
        <Text variant="titleS" color="textPrimary" align="center">
          {title}
        </Text>
        <Text variant="bodyM" color="textSecondary" align="center">
          {message}
        </Text>
      </YStack>
      {onRetry ? (
        <>
          <Spacer size={2} />
          <Button variant="outline" label="Retry" onPress={onRetry} />
        </>
      ) : null}
    </YStack>
  );
};
