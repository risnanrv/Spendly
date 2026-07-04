import { StyleSheet } from 'react-native';
import { Screen, Text, Button, YStack, SectionCard, NavigationHeader } from '@/components/ui';
import { router } from 'expo-router';

/**
 * Hidden Developer Options Screen.
 * Allows viewing design showcase catalogs.
 */
export default function DeveloperOptionsScreen() {
  const navigateToShowcase = () => {
    router.push('/(app)/settings/showcase');
  };

  return (
    <Screen padded={false}>
      <NavigationHeader title="Developer Options" />

      <YStack gap={4} style={styles.container}>
        <SectionCard title="Design System Specifications">
          <YStack gap={3}>
            <Text variant="bodyM" color="textSecondary">
              Browse through all interactive component variants, motion transitions, color palettes, and elevation rules.
            </Text>
            <Button
              variant="outline"
              label="Design System Showcase"
              onPress={navigateToShowcase}
              fullWidth
            />
          </YStack>
        </SectionCard>
      </YStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
