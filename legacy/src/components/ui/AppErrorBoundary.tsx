import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon } from 'lucide-react-native';
import { Screen } from './Screen';
import { YStack } from './YStack';
import { Text } from './Text';
import { Icon } from './Icon';
import { Button } from './Button';
import { Spacer } from './Spacer';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * AppErrorBoundary wraps component tree to catch rendering errors and display a recovery UI.
 */
export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught component tree rendering error:', { error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Screen padded>
          <YStack align="center" justify="center" gap={4} style={{ flex: 1, padding: 24 }}>
            <Icon name={AlertOctagon} size="xl" color="danger" />
            <Spacer size={2} />
            <Text variant="titleL" align="center">
              Application Error
            </Text>
            <Text variant="bodyM" color="textSecondary" align="center">
              An unexpected crash occurred inside this page view.
            </Text>
            {this.state.error?.message ? (
              <Text
                variant="bodyS"
                color="danger"
                align="center"
                style={{
                  padding: 12,
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                {this.state.error.message}
              </Text>
            ) : null}
            <Spacer size={4} />
            <Button variant="primary" label="Try Reloading View" onPress={this.handleReset} />
          </YStack>
        </Screen>
      );
    }

    return this.props.children;
  }
}
