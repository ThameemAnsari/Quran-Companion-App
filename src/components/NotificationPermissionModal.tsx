import React from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import {
  requestNotificationPermission,
  scheduleSmartDailyReminder,
} from '../services/notificationService';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const BENEFITS = [
  { icon: '🔥', text: 'Keep your streak alive with one meaningful ayah a day' },
  { icon: '🧠', text: 'Receive gentle reminders to reconnect with the Quran' },
  { icon: '🌙', text: 'End your day with calm, peaceful reflection' },
];

export const NotificationPermissionModal: React.FC<Props> = ({ visible, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const {
    setPermissionScreenShown,
    setPermissionDeniedDate,
    setNotificationsEnabled,
  } = useAppStore();

  async function handleEnable() {
    // Mark shown regardless of outcome so we never show again
    setPermissionScreenShown(true);

    const granted = await requestNotificationPermission();

    if (granted) {
      // Set enabled BEFORE dismissing so the Profile toggle reflects it immediately
      setNotificationsEnabled(true);
      await scheduleSmartDailyReminder(
        { lastActiveDate: null, streak: 0, selectedMood: null,
          lastNotificationTime: null, comebackSentDate: null, notificationsEnabled: true },
        20, 30
      );

      // Android: prompt user to disable battery optimization so alarms fire reliably
      if (Platform.OS === 'android') {
        Alert.alert(
          'One more step for Android',
          'To ensure reminders arrive even when the app is closed, please disable battery optimization for Quran Companion.\n\nGo to: Battery → "Don\'t optimize" or "Unrestricted"',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Skip', style: 'cancel' },
          ]
        );
      }
    } else {
      // System denied — record date for soft follow-up message
      setPermissionDeniedDate(new Date().toISOString().split('T')[0]);
      // On iOS, direct user to Settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      }
    }

    onDismiss();
  }

  function handleLater() {
    setPermissionScreenShown(true);
    setPermissionDeniedDate(new Date().toISOString().split('T')[0]);
    onDismiss();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleLater}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 16, Platform.OS === 'ios' ? 44 : 28) }]}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🔔</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>Stay Consistent with the Quran</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Allow gentle reminders to help you stay connected every day
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {BENEFITS.map((b) => (
              <View key={b.icon} style={styles.benefitRow}>
                <Text style={styles.benefitIcon}>{b.icon}</Text>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Privacy note */}
          <View style={styles.privacyRow}>
            <Ionicons name="lock-closed-outline" size={13} color="#9CA3AF" />
            <Text style={styles.privacyText}>
              Max 1 reminder per day · No spam · Turn off anytime
            </Text>
          </View>

          {/* CTA buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleEnable} activeOpacity={0.85}>
            <Ionicons name="notifications" size={18} color="#fff" style={styles.btnIcon} />
            <Text style={styles.primaryBtnText}>Enable Reminders</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleLater} activeOpacity={0.7}>
            <Text style={styles.secondaryBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F0FAF0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  iconEmoji: { fontSize: 34 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  benefits: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  benefitIcon: { fontSize: 18, lineHeight: 22 },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#D1FAE5',
    marginBottom: 14,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  privacyText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#2E7D32',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIcon: { marginRight: 2 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
