import { StyleSheet } from 'react-native';
import { Screen, Text, Button, YStack, AppLogo, Spacer, ScaleIn } from '@/components/ui';
import { router } from 'expo-router';

/**
 * Welcome / Onboarding Screen.
 * Provides entry routes to Login and Registration.
 */
export default function WelcomeScreen() {
  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    router.push('/(auth)/register');
  };

  return (
    <Screen padded>
      <YStack style={styles.container} justify="space-between" align="stretch">
        {/* Header Branding */}
        <CenterContent>
          <AppLogo size="lg" />
          <Spacer size={2} />
          <Text variant="bodyL" color="textSecondary" align="center">
            Track every expense. Understand every rupee.
          </Text>
        </CenterContent>

        {/* Feature Teasers */}
        <ScaleIn style={styles.promoCard}>
          <YStack gap={3}>
            <Text variant="titleS" color="textPrimary">
              Local-First & Sync Ready
            </Text>
            <Text variant="bodyM" color="textSecondary">
              Your financial data resides safely on your device. It updates instantly offline, and syncs seamlessly when you connect.
            </Text>
          </YStack>
        </ScaleIn>

        {/* Action triggers */}
        <YStack gap={3} style={styles.buttons}>
          <Button
            variant="primary"
            label="Create Account"
            onPress={handleRegister}
            fullWidth
            testID="welcome-register-btn"
          />
          <Button
            variant="outline"
            label="Log In"
            onPress={handleLogin}
            fullWidth
            testID="welcome-login-btn"
          />
          <Spacer size={2} />
          <Text variant="labelS" color="textTertiary" align="center">
            By continuing, you agree to Spendly's terms.
          </Text>
        </YStack>
      </YStack>
    </Screen>
  );
}

// Internal Center helper since we removed React import from files
const CenterContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <YStack align="center" justify="center" style={styles.header}>
      {children}
    </YStack>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    marginTop: 40,
  },
  promoCard: {
    backgroundColor: 'rgba(91, 69, 224, 0.04)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 69, 224, 0.08)',
  },
  buttons: {
    marginBottom: 16,
  },
});
