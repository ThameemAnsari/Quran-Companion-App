import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import {
  requestNotificationPermission,
  cancelAllNotifications,
  scheduleDailyEvaluationTrigger,
} from '../services/notificationService';

export const ProfileScreen: React.FC = () => {
  const { streak, weekStats, bookmarks, reflections, notificationsEnabled, setNotificationsEnabled } = useAppStore();

  async function handleToggleReminders(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleDailyEvaluationTrigger(18, 0);
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

  type MenuItem = {
    icon: string;
    label: string;
    sub: string;
    toggle?: boolean;
  };

  const menuItems: MenuItem[] = [
    { icon: 'notifications-outline', label: 'Daily Reminders', sub: notificationsEnabled ? 'Enabled' : 'Tap to enable', toggle: true },
    { icon: 'language-outline', label: 'Translation Language', sub: 'English (Sahih International)' },
    { icon: 'musical-notes-outline', label: 'Reciter', sub: 'Mishary Alafasy' },
    { icon: 'moon-outline', label: 'Dark Mode', sub: 'Coming soon' },
    { icon: 'share-outline', label: 'Share App', sub: 'Share with friends' },
    { icon: 'information-circle-outline', label: 'About', sub: 'Version 1.1.0' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🕌</Text>
          </View>
          <Text style={styles.name}>My Quran Journey</Text>
          <Text style={styles.tagline}>In the remembrance of Allah do hearts find rest.</Text>
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
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={item.toggle ? 1 : 0.7}
                onPress={item.toggle ? undefined : undefined}
              >
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon as any} size={20} color="#2E7D32" />
                </View>
                <View style={styles.menuInfo}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                {item.toggle ? (
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleReminders}
                    trackColor={{ false: '#E5E7EB', true: '#A5D6A7' }}
                    thumbColor={notificationsEnabled ? '#2E7D32' : '#9CA3AF'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                )}
              </TouchableOpacity>
              {i < menuItems.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

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
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarEmoji: { fontSize: 44 },
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
});
