import { useEffect, useRef } from 'react';
import { StyleSheet, View, Modal, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { Text, Button, Card, XStack, YStack, Divider } from '@/components/ui';
import { useSync } from '@/hooks/useSync';
import * as Icons from 'lucide-react-native';

const CloudOffIcon = Icons.CloudOff as any;
const RefreshCwIcon = Icons.RefreshCw as any;
const AlertCircleIcon = Icons.AlertCircle as any;
const CheckCircle2Icon = Icons.CheckCircle2 as any;
const XIcon = Icons.X as any;

/**
 * SyncStatusBadge renders a color-coded status badge showing the sync engine state.
 */
export const SyncStatusBadge = () => {
  const { syncStatus, isOnline } = useSync();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (syncStatus === 'syncing') {
      spinValue.setValue(0);
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      spinValue.setValue(0);
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [syncStatus, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  let label = 'Synced';
  let color = '#10B981';
  let Icon = CheckCircle2Icon;

  if (syncStatus === 'syncing') {
    label = 'Syncing';
    color = '#3B82F6';
    Icon = RefreshCwIcon;
  } else if (syncStatus === 'error') {
    label = 'Error';
    color = '#EF4444';
    Icon = AlertCircleIcon;
  } else if (!isOnline) {
    label = 'Offline';
    color = '#6B7280';
    Icon = CloudOffIcon;
  }

  return (
    <XStack align="center" gap={1} style={{ ...styles.badge, backgroundColor: color + '15', borderColor: color }}>
      {syncStatus === 'syncing' ? (
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Icon size={12} color={color} />
        </Animated.View>
      ) : (
        <Icon size={12} color={color} />
      )}
      <Text variant="labelS" style={{ ...styles.badgeText, color }}>
        {label}
      </Text>
    </XStack>
  );
};

/**
 * PendingChangesCard displays details of pending local changes inside the outbox queue.
 */
export const PendingChangesCard = () => {
  const { pendingCount, triggerSync, syncStatus, isOnline } = useSync();

  if (pendingCount === 0) return null;

  return (
    <Card style={styles.pendingCard}>
      <YStack gap={2}>
        <XStack align="center" justify="space-between">
          <XStack align="center" gap={2}>
            <View style={styles.amberDot} />
            <Text variant="labelM" color="textPrimary">
              Unsaved Offline Changes
            </Text>
          </XStack>
          <Text variant="bodyS" color="warning" style={styles.countText}>
            {pendingCount} item{pendingCount === 1 ? '' : 's'}
          </Text>
        </XStack>
        <Text variant="bodyS" color="textSecondary">
          These updates are stored locally and will be uploaded to the cloud when internet connection is restored.
        </Text>
        {isOnline && (
          <Button
            variant="outline"
            label="Upload Changes Now"
            onPress={triggerSync}
            loading={syncStatus === 'syncing'}
            disabled={syncStatus === 'syncing'}
          />
        )}
      </YStack>
    </Card>
  );
};

/**
 * SyncErrorDialog displays sync diagnostic details and debug trace output in a modal.
 */
export interface SyncErrorDialogProps {
  visible: boolean;
  onClose: () => void;
}

export const SyncErrorDialog = ({ visible, onClose }: SyncErrorDialogProps) => {
  const { lastError, triggerSync, syncStatus } = useSync();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <XStack align="center" justify="space-between" style={styles.modalHeader}>
            <Text variant="titleM" color="textPrimary">
              Sync Diagnostics
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <XIcon size={18} color="#9CA3AF" />
            </Pressable>
          </XStack>
          <Divider />
          <ScrollView style={styles.modalBody}>
            <YStack gap={3} style={styles.modalContent}>
              <XStack gap={2} align="flex-start" style={styles.errorBox}>
                <AlertCircleIcon size={20} color="#EF4444" style={styles.errorIcon} />
                <YStack gap={1} style={{ flex: 1 }}>
                  <Text variant="labelM" color="danger">
                    Sync Execution Failed
                  </Text>
                  <Text variant="bodyM" color="textSecondary">
                    Spendly sync engine encountered a server error during transmission.
                  </Text>
                </YStack>
              </XStack>

              <Text variant="labelS" color="textSecondary">
                DEBUG TRACE
              </Text>
              <View style={styles.traceContainer}>
                <Text variant="bodyS" color="textSecondary" style={styles.traceText}>
                  {lastError || 'Unknown connection error. Please verify api routing hosts.'}
                </Text>
              </View>
            </YStack>
          </ScrollView>
          <Divider />
          <XStack justify="flex-end" gap={2} style={styles.modalFooter}>
            <Button
              variant="outline"
              label="Close"
              onPress={onClose}
            />
            <Button
              variant="primary"
              label="Retry Synchronization"
              onPress={() => {
                triggerSync();
                onClose();
              }}
              loading={syncStatus === 'syncing'}
              disabled={syncStatus === 'syncing'}
            />
          </XStack>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.1,
  },
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  countText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    padding: 16,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 300,
  },
  modalContent: {
    padding: 16,
  },
  errorBox: {
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  errorIcon: {
    marginTop: 2,
  },
  traceContainer: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  traceText: {
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
  },
});
