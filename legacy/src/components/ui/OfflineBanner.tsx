import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { Text } from './Text';
import { useSync } from '@/hooks/useSync';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * OfflineBanner displays a premium warning banner at the top of the screen
 * whenever active connection drops, using smooth layout spring transitions.
 */
export const OfflineBanner = () => {
  const { isOnline } = useSync();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const [visible, setVisible] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [isOnline, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top > 0 ? insets.top : 8,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text variant="labelS" color="textInverse" align="center" style={styles.label}>
        Offline Mode — Changes will sync when online
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
