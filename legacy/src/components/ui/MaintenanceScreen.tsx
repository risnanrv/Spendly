import { StyleSheet } from 'react-native';
import { Screen } from './Screen';
import { Text } from './Text';
import { Button } from './Button';
import { YStack } from './YStack';
import { AppLogo } from './AppLogo';
import { Spacer } from './Spacer';
import { Icon } from './Icon';
import { Construction } from 'lucide-react-native';

interface MaintenanceScreenProps {
  onCheckStatus?: () => void;
}

/**
 * Premium MaintenanceScreen displayed when API responds with service unavailability.
 */
export const MaintenanceScreen = ({
  onCheckStatus,
}: MaintenanceScreenProps) => {
  return (
    <Screen padded>
      <YStack align="center" justify="center" gap={4} style={styles.container}>
        <Icon name={Construction} size="xl" color="warning" />
        <Spacer size={2} />
        
        <AppLogo size="sm" />
        <Spacer size={2} />

        <Text variant="titleL" align="center">
          Under Scheduled Maintenance
        </Text>
        <Text variant="bodyM" color="textSecondary" align="center">
          We are upgrading our cloud infrastructure to serve you better. We'll be back shortly.
        </Text>

        <Spacer size={4} />

        {onCheckStatus ? (
          <Button
            variant="outline"
            label="Refresh Status"
            onPress={onCheckStatus}
            fullWidth
          />
        ) : null}
      </YStack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
  },
});
