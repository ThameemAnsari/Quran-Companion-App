import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Share,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAppStore } from '../store/useAppStore';
import {
  requestNotificationPermission,
  cancelAllNotifications,
  scheduleSmartDailyReminder,
  scheduleTestNotification,
} from '../services/notificationService';

export const ProfileScreen: React.FC = () => {
  const { streak, weekStats, bookmarks, reflections, notificationsEnabled, setNotificationsEnabled, dailyStats, selectedTranslationName } = useAppStore();

  const totalAyahsRead = Math.max(
    weekStats.ayahsRead,
    Object.values(dailyStats).reduce((sum, d) => sum + (d.ayahsRead ?? 0), 0)
  );
  const totalDaysConnected = Object.values(dailyStats).filter(
    (d) => (d.ayahsRead ?? 0) > 0 || (d.timeSpentMinutes ?? 0) > 0
  ).length;

  async function handleToggleReminders(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        if (Device.isDevice) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications for Quran Companion in your device Settings to receive daily reminders.',
            [{ text: 'OK' }]
          );
          return;
        }
        // Simulator: fall through and enable anyway so UI is testable
      }
      // Schedule with generic context; App.tsx personalises on next background
      await scheduleSmartDailyReminder(
        { lastActiveDate: null, streak: 0, selectedMood: null,
          lastNotificationTime: null, comebackSentDate: null, notificationsEnabled: true },
        20, 30
      );
    } else {
      await cancelAllNotifications();
    }
    setNotificationsEnabled(value);
  }

  function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  }

  async function handleShare() {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('[notif] Scheduled notifications:', JSON.stringify(scheduled, null, 2));
    await Share.share({
      message:
        '📖 I\'ve been using Quran Companion to reflect on ayahs that match my mood. It\'s a beautiful way to connect with the Quran daily. Try it out!',
    });
  }

  type MenuItem = {
    icon: string;
    label: string;
    sub: string;
    toggle?: boolean;
    onPress?: () => void;
  };

  const menuItems: MenuItem[] = [
    { icon: 'notifications-outline', label: 'Daily Reminders', sub: notificationsEnabled ? 'Enabled' : 'Tap to enable', toggle: true },
    { icon: 'language-outline', label: 'Translation Language', sub: selectedTranslationName },
    { icon: 'musical-notes-outline', label: 'Reciter', sub: 'Mishary Alafasy' },
    { icon: 'share-outline', label: 'Share App', sub: 'Share with friends', onPress: handleShare },
    { icon: 'information-circle-outline', label: 'About', sub: 'Version 1.1.0' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Image
            source={require('../../assets/app_icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.name}>My Quran Journey</Text>
          <Text style={styles.tagline}>In the remembrance of Allah do hearts find rest.</Text>
        </View>

        {/* Total summary banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalAyahsRead}</Text>
            <Text style={styles.summaryLabel}>Total Ayahs Read</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalDaysConnected}</Text>
            <Text style={styles.summaryLabel}>Days with Quran</Text>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Streak', value: `${streak}🔥` },
            { label: 'Bookmarks', value: String(bookmarks.length) },
            { label: 'Reflections', value: String(reflections.length) },
            { label: 'Time Spent', value: formatTime(weekStats.timeSpentMinutes) },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <React.Fragment key={item.label}>
              {item.toggle ? (
                <View style={styles.menuItem}>
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleReminders}
                    trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
                    thumbColor={notificationsEnabled ? '#2E7D32' : '#9CA3AF'}
                  />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                >
                  <View style={styles.menuIconWrap}>
                    <Ionicons name={item.icon as any} size={20} color="#2E7D32" />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuSub}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* TEMP: Notification debug button */}
        {/* <TouchableOpacity
          style={styles.testNotifBtn}
          activeOpacity={0.8}
          onPress={async () => {
            // Log raw OS status before going through the service
            const { status: rawStatus } = await Notifications.getPermissionsAsync();
            console.log('[test] raw OS permission:', rawStatus, '| isDevice:', Device.isDevice);

            const granted = await requestNotificationPermission();
            if (!granted) {
              Alert.alert(
                'Permission denied',
                `OS status: "${rawStatus}" | isDevice: ${Device.isDevice}\n\nIf status is "granted", go to Settings → Apps → Quran Companion → Notifications and ensure it is enabled.`
              );
              return;
            }
            await scheduleTestNotification();
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            console.log('[notif] After test schedule:', JSON.stringify(scheduled, null, 2));
            Alert.alert('Scheduled!', `Notification in 10s.\nScheduled count: ${scheduled.length}\n\nYou can keep the app open — it will appear as a banner.`);
          }}
        >
          <Ionicons name="notifications" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.testNotifText}>Test Notification (debug)</Text>
        </TouchableOpacity> */}

        <Text style={styles.footer}>
          May Allah bless your journey with the Quran. 🌿
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 14,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
    textAlign: 'center',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#1B1B1B' },
  menuSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  menuDivider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  testNotifText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 6,
  },
});
