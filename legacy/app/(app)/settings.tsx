import { useState } from 'react';
import { StyleSheet, Pressable, ScrollView } from 'react-native';
import { Screen, Text, Spacer, Button, YStack, XStack, SectionCard, NavigationHeader } from '@/components/ui';
import { router } from 'expo-router';
import { useLogout } from '@/hooks/useAuth';
import { logger } from '@/utils/logger';
import { useSync } from '@/hooks/useSync';
import { SyncStatusBadge, PendingChangesCard, SyncErrorDialog } from '@/components/sync/SyncWidgets';
import {
  ProfileCard,
  ThemeSelector,
  CurrencySelector,
  NotificationCard,
  BackupCard,
  ExportCard,
  AboutCard,
} from '@/components/settings/SettingsComponents';

/**
 * Settings Screen.
 * Exposes profile, appearance, local notification configs, backup & restore, CSV/PDF exports, and cloud sync status logs.
 */
export default function SettingsScreen() {
  const [clickCount, setClickCount] = useState(0);
  const [isDevMode, setIsDevMode] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const { syncStatus, lastSyncedAt, triggerSync, isOnline } = useSync();
  const { mutate: logout, isPending } = useLogout();

  const handleVersionClick = () => {
    if (isDevMode) return;

    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (nextCount === 7) {
      setIsDevMode(true);
      logger.info('Developer Mode Activated');
    }
  };

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        router.replace('/(auth)');
      },
    });
  };

  const navigateToDeveloper = () => {
    router.push('/(app)/settings/developer');
  };

  return (
    <Screen padded={false}>
      <NavigationHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <YStack gap={4} style={styles.container}>
          {/* User Account & Edit Profile Card */}
          <ProfileCard />

          {/* Sync Outbox status banner */}
          <PendingChangesCard />

          {/* Cloud Synchronization Details */}
          <SectionCard title="Cloud Synchronization">
            <YStack gap={3}>
              <XStack align="center" justify="space-between">
                <Text variant="bodyM" color="textSecondary">
                  Sync Status
                </Text>
                <SyncStatusBadge />
              </XStack>

              <XStack align="center" justify="space-between">
                <Text variant="bodyM" color="textSecondary">
                  Last Synced
                </Text>
                <Text variant="bodyM" color="textPrimary">
                  {lastSyncedAt
                    ? new Date(lastSyncedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Never synced'}
                </Text>
              </XStack>

              {syncStatus === 'error' && (
                <Button
                  variant="outline"
                  label="View Sync Diagnostics"
                  onPress={() => setShowDiagnostics(true)}
                  fullWidth
                />
              )}

              {isOnline && syncStatus !== 'syncing' && (
                <Button
                  variant="outline"
                  label="Sync Now"
                  onPress={triggerSync}
                  fullWidth
                />
              )}
            </YStack>
          </SectionCard>

          {/* Theme Segmented Selector */}
          <ThemeSelector />

          {/* Currency bottom sheet selector */}
          <SectionCard title="Regional Options">
            <YStack gap={1}>
              <CurrencySelector />
              <Spacer size={1} />
              <Button
                variant="outline"
                label="Configure Custom Categories"
                onPress={() => router.push('/(app)/categories')}
                fullWidth
                testID="settings-categories-btn"
              />
            </YStack>
          </SectionCard>

          {/* Notification toggles */}
          <NotificationCard />

          {/* Manual local Backup & Restore */}
          <BackupCard />

          {/* CSV / PDF Export */}
          <ExportCard />

          {/* Developer options shortcut (visible only when easter egg is activated) */}
          {isDevMode ? (
            <SectionCard title="Developer Settings">
              <YStack gap={3}>
                <Text variant="bodyM" color="warning">
                  Developer Mode is enabled. You can now access design logs and style showcase previews.
                </Text>
                <Button
                  variant="outline"
                  label="Go to Developer Options"
                  onPress={navigateToDeveloper}
                  fullWidth
                />
              </YStack>
            </SectionCard>
          ) : null}

          {/* Licenses, privacy, terms links */}
          <AboutCard />

          <Spacer size={2} />

          {/* Logout Action */}
          <Button
            variant="destructive"
            label="Log Out"
            onPress={handleLogout}
            loading={isPending}
            disabled={isPending}
            fullWidth
            testID="settings-logout-btn"
          />

          <Spacer size={2} />

          <Pressable onPress={handleVersionClick}>
            <Text variant="bodyS" color="textTertiary" align="center">
              Spendly v1.0.0 {isDevMode ? '(Developer Mode)' : ''}
            </Text>
          </Pressable>
        </YStack>
      </ScrollView>

      <SyncErrorDialog
        visible={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
