import { useState } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Switch,
  Modal,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  XStack,
  YStack,
  Divider,
  Spacer,
  TextInput,
  SectionCard,
} from '@/components/ui';
import { useTheme } from '@/hooks/useTheme';
import { useTheme as useSettingsTheme, useCurrency, useNotifications } from '@/hooks/useSettings';
import { useProfile } from '@/hooks/useProfile';
import { logger } from '@/utils/logger';
import { useBackup } from '@/hooks/useBackup';
import { useExport } from '@/hooks/useExport';
import { useAuthStore } from '@/stores/auth.store';
import * as Haptics from 'expo-haptics';
import * as Icons from 'lucide-react-native';
import { getMonthStr } from '@/utils/date';

// ─── Haptic Feedback Helper ──────────────────────────────────────────────────
export const triggerHaptic = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

// ─── Dynamic Icon Renderer ───────────────────────────────────────────────────
export const SettingsIcon = ({ name, color, size = 20 }: { name: string; color: string; size?: number }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} color={color} />;
};

// ─── SettingsItem Component ──────────────────────────────────────────────────
interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  chevron?: boolean;
  badge?: string;
  onPress?: () => void;
  destructive?: boolean;
}

export const SettingsItem = ({
  icon,
  title,
  subtitle,
  switchValue,
  onSwitchChange,
  chevron,
  badge,
  onPress,
  destructive = false,
}: SettingsItemProps) => {
  const theme = useTheme();

  const handlePress = () => {
    if (onPress) {
      triggerHaptic();
      onPress();
    }
  };

  const content = (
    <XStack align="center" justify="space-between" style={styles.itemContainer}>
      <XStack align="center" gap={3} style={{ flex: 1 }}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.bgSecondary }]}>
          <SettingsIcon
            name={icon}
            color={destructive ? theme.colors.danger : theme.colors.textSecondary}
          />
        </View>
        <YStack gap={0.5} style={{ flex: 1 }}>
          <Text
            variant="bodyM"
            style={{
              ...styles.itemTitle,
              color: destructive ? theme.colors.danger : theme.colors.textPrimary,
            }}
          >
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodyS" color="textTertiary">
              {subtitle}
            </Text>
          )}
        </YStack>
      </XStack>

      <XStack align="center" gap={2}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: theme.colors.brandPrimary + '15' }]}>
            <Text variant="labelS" style={{ color: theme.colors.brandPrimary }}>
              {badge}
            </Text>
          </View>
        )}

        {switchValue !== undefined && onSwitchChange !== undefined && (
          <Switch
            value={switchValue}
            onValueChange={(val) => {
              triggerHaptic();
              onSwitchChange(val);
            }}
            trackColor={{ false: '#D1D5DB', true: theme.colors.brandPrimary }}
            thumbColor="#FFFFFF"
          />
        )}

        {chevron && (
          <Icons.ChevronRight size={16} color={theme.colors.textTertiary} />
        )}
      </XStack>
    </XStack>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { backgroundColor: theme.colors.bgSecondary },
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={subtitle || 'Select item'}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
};

// ─── ProfileCard Component ───────────────────────────────────────────────────
export const ProfileCard = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { pickAvatar, updateProfile, isUpdatingProfile } = useProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || null);

  const handlePickAvatar = async () => {
    try {
      const uri = await pickAvatar();
      if (uri) {
        setEditAvatar(uri);
      }
    } catch (err) {
      logger.error('ProfileCard: Failed to select photo:', err);
    }
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    try {
      triggerHaptic();
      await updateProfile({ name: editName.trim(), avatarUrl: editAvatar });
      setModalVisible(false);
    } catch (err) {
      logger.error('ProfileCard: Save failed:', err);
    }
  };

  const handleOpen = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatarUrl || null);
    setModalVisible(true);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'SP';

  return (
    <Card style={styles.profileCard}>
      <XStack align="center" gap={4}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.brandPrimary + '20' }]}>
            <Text variant="titleM" style={{ color: theme.colors.brandPrimary }}>
              {initials}
            </Text>
          </View>
        )}

        <YStack gap={1} style={{ flex: 1 }}>
          <Text variant="titleS" color="textPrimary">
            {user?.name || 'Anonymous User'}
          </Text>
          <Text variant="bodyM" color="textSecondary">
            {user?.email || 'No email associated'}
          </Text>
          <Spacer size={1} />
          <Button
            variant="outline"
            label="Edit Profile"
            onPress={handleOpen}
            style={styles.editBtn}
          />
        </YStack>
      </XStack>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.bgPrimary }]}>
            <XStack align="center" justify="space-between" style={styles.modalHeader}>
              <Text variant="titleM" color="textPrimary">
                Edit Profile
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Icons.X size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </XStack>
            
            <Divider />

            <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingVertical: 16 }}>
              <YStack align="center" gap={3}>
                <Pressable onPress={handlePickAvatar} style={styles.avatarPickerWrapper}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.avatarPickerImage} />
                  ) : (
                    <View style={[styles.avatarPickerPlaceholder, { backgroundColor: theme.colors.bgSecondary }]}>
                      <Icons.Camera size={28} color={theme.colors.textSecondary} />
                      <Spacer size={1} />
                      <Text variant="bodyS" color="textSecondary">
                        Change Photo
                      </Text>
                    </View>
                  )}
                </Pressable>

                <Spacer size={2} />
                <View style={{ width: '100%' }}>
                  <TextInput
                    label="Full Name"
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    autoFocus
                  />
                </View>
              </YStack>
            </ScrollView>

            <Divider />

            <XStack justify="flex-end" gap={2} style={styles.modalFooter}>
              <Button
                variant="outline"
                label="Cancel"
                onPress={() => setModalVisible(false)}
              />
              <Button
                variant="primary"
                label="Save Changes"
                onPress={handleSave}
                loading={isUpdatingProfile}
                disabled={!editName.trim() || isUpdatingProfile}
              />
            </XStack>
          </View>
        </View>
      </Modal>
    </Card>
  );
};

// ─── ThemeSelector Component ─────────────────────────────────────────────────
export const ThemeSelector = () => {
  const theme = useTheme();
  const { themePreference, setTheme } = useSettingsTheme();

  const handleSelect = (pref: 'light' | 'dark' | 'system') => {
    triggerHaptic();
    setTheme(pref);
  };

  const options: Array<{ key: 'light' | 'dark' | 'system'; label: string; icon: string }> = [
    { key: 'light', label: 'Light', icon: 'Sun' },
    { key: 'dark', label: 'Dark', icon: 'Moon' },
    { key: 'system', label: 'System', icon: 'Laptop' },
  ];

  return (
    <SectionCard title="Appearance">
      <XStack gap={2} style={styles.segmentedContainer}>
        {options.map((opt) => {
          const isActive = themePreference === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => handleSelect(opt.key)}
              style={[
                styles.segmentItem,
                isActive && {
                  backgroundColor: theme.colors.brandPrimary,
                  borderColor: theme.colors.brandPrimary,
                },
                !isActive && {
                  backgroundColor: theme.colors.bgSecondary,
                  borderColor: theme.colors.borderDefault,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
            >
              <XStack gap={1} align="center" justify="center">
                <SettingsIcon
                  name={opt.icon}
                  color={isActive ? '#FFFFFF' : theme.colors.textSecondary}
                  size={16}
                />
                <Text
                  variant="labelS"
                  style={{ color: isActive ? '#FFFFFF' : theme.colors.textSecondary }}
                >
                  {opt.label}
                </Text>
              </XStack>
            </Pressable>
          );
        })}
      </XStack>
    </SectionCard>
  );
};

// ─── CurrencySelector Component ──────────────────────────────────────────────
export const CurrencySelector = () => {
  const theme = useTheme();
  const { currency, setCurrency } = useCurrency();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (curr: string) => {
    triggerHaptic();
    setCurrency(curr);
    setModalVisible(false);
  };

  const list = [
    { code: 'INR', label: 'Indian Rupee (₹)' },
    { code: 'USD', label: 'United States Dollar ($)' },
    { code: 'EUR', label: 'Euro (€)' },
    { code: 'GBP', label: 'British Pound (£)' },
    { code: 'AED', label: 'UAE Dirham (د.إ)' },
  ];

  const currentLabel = list.find((c) => c.code === currency)?.label || currency;

  return (
    <>
      <SettingsItem
        icon="Coins"
        title="Primary Currency"
        subtitle={currentLabel}
        badge={currency}
        chevron
        onPress={() => setModalVisible(true)}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.bgPrimary }]}>
            <XStack align="center" justify="space-between" style={styles.modalHeader}>
              <Text variant="titleM" color="textPrimary">
                Select Currency
              </Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Icons.X size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </XStack>

            <Divider />

            <ScrollView style={styles.modalBody}>
              <YStack gap={1} style={{ paddingVertical: 12 }}>
                {list.map((c) => {
                  const isActive = currency === c.code;
                  return (
                    <Pressable
                      key={c.code}
                      onPress={() => handleSelect(c.code)}
                      style={[
                        styles.currencyItem,
                        isActive && { backgroundColor: theme.colors.brandPrimary + '10' },
                      ]}
                    >
                      <XStack justify="space-between" align="center">
                        <Text
                          variant="bodyM"
                          style={isActive ? { color: theme.colors.brandPrimary, fontWeight: '600' } : { color: theme.colors.textPrimary }}
                        >
                          {c.label}
                        </Text>
                        {isActive && (
                          <Icons.Check size={18} color={theme.colors.brandPrimary} />
                        )}
                      </XStack>
                    </Pressable>
                  );
                })}
              </YStack>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── NotificationCard Component ──────────────────────────────────────────────
export const NotificationCard = () => {
  const { preferences, setPreference } = useNotifications();

  return (
    <SectionCard title="Notifications">
      <YStack gap={1}>
        <SettingsItem
          icon="AlertTriangle"
          title="Budget Limit Warnings"
          subtitle="Alert when spending hits 80% or 100%"
          switchValue={preferences?.budgetAlerts ?? true}
          onSwitchChange={(val) => setPreference({ key: 'budgetAlerts', enabled: val })}
        />
        <Divider />
        <SettingsItem
          icon="Calendar"
          title="Daily Entry Reminders"
          subtitle="Daily evening alerts to record purchases"
          switchValue={preferences?.dailyReminder ?? true}
          onSwitchChange={(val) => setPreference({ key: 'dailyReminder', enabled: val })}
        />
        <Divider />
        <SettingsItem
          icon="BarChart2"
          title="Weekly Summary Logs"
          subtitle="Brief weekly spending breakdowns"
          switchValue={preferences?.weeklySummary ?? false}
          onSwitchChange={(val) => setPreference({ key: 'weeklySummary', enabled: val })}
        />
        <Divider />
        <SettingsItem
          icon="TrendingUp"
          title="Monthly Finance Review"
          subtitle="Complete monthly totals statement summary"
          switchValue={preferences?.monthlySummary ?? false}
          onSwitchChange={(val) => setPreference({ key: 'monthlySummary', enabled: val })}
        />
        <Divider />
        <SettingsItem
          icon="Cloud"
          title="Cloud Sync Alerts"
          subtitle="Instant status change notifications"
          switchValue={preferences?.syncNotifications ?? true}
          onSwitchChange={(val) => setPreference({ key: 'syncNotifications', enabled: val })}
        />
      </YStack>
    </SectionCard>
  );
};

// ─── BackupCard Component ────────────────────────────────────────────────────
export const BackupCard = () => {
  const theme = useTheme();
  const { exportBackup, importBackup, isExporting, isImporting } = useBackup();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const handleBackup = async () => {
    try {
      triggerHaptic();
      await exportBackup();
    } catch (err) {
      logger.error('BackupCard: Backup export failed:', err);
    }
  };

  const handleRestoreClick = () => {
    triggerHaptic();
    setConfirmVisible(true);
  };

  const handleConfirmRestore = async () => {
    setConfirmVisible(false);
    try {
      triggerHaptic();
      await importBackup();
    } catch (err) {
      logger.error('BackupCard: Backup import failed:', err);
    }
  };

  return (
    <SectionCard title="Database Backups">
      <YStack gap={3}>
        <Text variant="bodyM" color="textSecondary">
          Save your transactions locally. Backups contain expenses, budgets, and settings configuration details.
        </Text>
        
        <XStack gap={2}>
          <Button
            variant="outline"
            label="Backup Data"
            onPress={handleBackup}
            loading={isExporting}
            style={{ flex: 1 }}
          />
          <Button
            variant="outline"
            label="Restore Data"
            onPress={handleRestoreClick}
            loading={isImporting}
            style={{ flex: 1 }}
          />
        </XStack>
      </YStack>

      <Modal
        visible={confirmVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogContainer, { backgroundColor: theme.colors.bgPrimary }]}>
            <Text variant="titleS" color="textPrimary" style={styles.dialogTitle}>
              Confirm Restoration ⚠️
            </Text>
            <Text variant="bodyM" color="textSecondary" style={styles.dialogBody}>
              Restoring backup data will wipe all current transactions and categories and replace them with the selected snapshot details. This action is irreversible.
            </Text>
            <XStack justify="flex-end" gap={2} style={styles.dialogFooter}>
              <Button
                variant="outline"
                label="Cancel"
                onPress={() => setConfirmVisible(false)}
              />
              <Button
                variant="destructive"
                label="Wipe & Restore"
                onPress={handleConfirmRestore}
              />
            </XStack>
          </View>
        </View>
      </Modal>
    </SectionCard>
  );
};

// ─── ExportCard Component ────────────────────────────────────────────────────
export const ExportCard = () => {
  const { exportCSV, exportPDF, isExportingCSV, isExportingPDF } = useExport();
  const currentMonth = getMonthStr(new Date());

  const handleExportCSV = async () => {
    try {
      triggerHaptic();
      await exportCSV(currentMonth);
    } catch (err) {
      logger.error('ExportCard: CSV download failed:', err);
    }
  };

  const handleExportPDF = async () => {
    try {
      triggerHaptic();
      await exportPDF(currentMonth);
    } catch (err) {
      logger.error('ExportCard: PDF generation failed:', err);
    }
  };

  return (
    <SectionCard title="Data Exports">
      <YStack gap={3}>
        <Text variant="bodyM" color="textSecondary">
          Export your current monthly spending statement statement summary. Support files share natively.
        </Text>

        <XStack gap={2}>
          <Button
            variant="outline"
            label="Share CSV Log"
            onPress={handleExportCSV}
            loading={isExportingCSV}
            style={{ flex: 1 }}
          />
          <Button
            variant="outline"
            label="Share PDF Summary"
            onPress={handleExportPDF}
            loading={isExportingPDF}
            style={{ flex: 1 }}
          />
        </XStack>
      </YStack>
    </SectionCard>
  );
};

// ─── AboutCard Component ─────────────────────────────────────────────────────
export const AboutCard = () => {
  return (
    <SectionCard title="About Spendly">
      <YStack gap={1}>
        <SettingsItem
          icon="ShieldCheck"
          title="Privacy Policy"
          chevron
          onPress={() => logger.info('AboutCard: Load privacy policy')}
        />
        <Divider />
        <SettingsItem
          icon="FileText"
          title="Terms of Service"
          chevron
          onPress={() => logger.info('AboutCard: Load terms of service')}
        />
        <Divider />
        <SettingsItem
          icon="Code"
          title="Open Source Licenses"
          chevron
          onPress={() => logger.info('AboutCard: Load licenses list')}
        />
      </YStack>
    </SectionCard>
  );
};

// ─── Stylesheet ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
  itemContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontWeight: '500',
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  profileCard: {
    padding: 16,
    marginBottom: 8,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: 12,
  },
  segmentedContainer: {
    padding: 2,
    borderRadius: 8,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  currencyItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    padding: 16,
  },
  modalBody: {
    maxHeight: 320,
    paddingHorizontal: 16,
  },
  modalFooter: {
    padding: 16,
  },
  avatarPickerWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
  },
  avatarPickerImage: {
    width: 96,
    height: 96,
  },
  avatarPickerPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  dialogContainer: {
    margin: 24,
    borderRadius: 12,
    padding: 20,
    alignSelf: 'center',
    maxWidth: 320,
  },
  dialogTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  dialogBody: {
    lineHeight: 20,
    marginBottom: 20,
  },
  dialogFooter: {
    marginTop: 8,
  },
});
