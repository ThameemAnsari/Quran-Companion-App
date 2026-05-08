import React, { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useAuthRequest, makeRedirectUri } from 'expo-auth-session';
import { useAppStore } from '../store/useAppStore';
import {
  requestNotificationPermission,
  cancelAllNotifications,
  scheduleSmartDailyReminder,
  scheduleTestNotification,
} from '../services/notificationService';
import {
  QF_CLIENT_ID,
  QF_REDIRECT_URI,
  QF_DISCOVERY,
  exchangeCodeForToken,
  fetchQuranComStreakDays,
  getSavedAccessToken,
  clearTokens,
} from '../services/quranAuth';

export const ProfileScreen: React.FC = () => {
  const { streak, weekStats, bookmarks, reflections, notificationsEnabled, setNotificationsEnabled, dailyStats, selectedTranslationName, setStreak } = useAppStore();

  // ── Quran.com sync state ──────────────────────────────────────────────────
  const [qfStreak, setQfStreak] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  // Guard: track which auth code we've already exchanged to prevent double-fire
  const processedCodeRef = useRef<string | null>(null);

  // makeRedirectUri with native ensures the exact registered URI is used
  // on a native build regardless of environment
  // qurancompanion://oauth/callback
  // com.qurancompanion.app://oauth/callback
  const redirectUri = makeRedirectUri({ native: 'qurancompanion://oauth/callback' });

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: QF_CLIENT_ID,
      scopes: ['openid', 'streak', 'offline_access'],
      redirectUri,
      usePKCE: true,
    },
    QF_DISCOVERY,
  );

  // Restore session from secure storage on mount
  useEffect(() => {
    getSavedAccessToken().then(async (token) => {
      if (!token) return;
      setIsConnected(true);
      const days = await fetchQuranComStreakDays(token);
      if (days !== null) {
        setQfStreak(days);
        setSyncStatus('success');
        const best = Math.max(streak, days);
        if (best !== streak) setStreak(best);
      }
    });
  }, []);

  // Handle OAuth2 response
  useEffect(() => {
    if (!response) return;
    console.log('[QF Auth] response =', JSON.stringify(response));
    if (response.type === 'error') {
      setSyncStatus('error');
      Alert.alert('Sign-in failed', response.error?.message ?? 'Unknown error');
      return;
    }
    if (response.type !== 'success' || !request?.codeVerifier) return;
    // Prevent exchanging the same code twice (React re-render / Strict Mode)
    if (processedCodeRef.current === response.params.code) return;
    processedCodeRef.current = response.params.code;

    (async () => {
      setSyncStatus('loading');
      try {
        const token = await exchangeCodeForToken(
          response.params.code,
          request.codeVerifier!,
          redirectUri,
        );
        setIsConnected(true);
        const days = await fetchQuranComStreakDays(token);
        if (days !== null) {
          setQfStreak(days);
          const best = Math.max(streak, days);
          if (best !== streak) setStreak(best);
        }
        setSyncStatus('success');
      } catch (e: any) {
        setSyncStatus('error');
        Alert.alert('Sync failed', e?.message ?? 'Could not connect to Quran.com');
      }
    })();
  }, [response]);

  async function handleSync() {
    if (isConnected) {
      // Re-fetch streak with stored token
      setSyncStatus('loading');
      const token = await getSavedAccessToken();
      if (!token) { setIsConnected(false); setSyncStatus('idle'); return; }
      const days = await fetchQuranComStreakDays(token);
      if (days !== null) {
        setQfStreak(days);
        setSyncStatus('success');
        const best = Math.max(streak, days);
        if (best !== streak) setStreak(best);
      } else { setSyncStatus('error'); }
      return;
    }
    console.log('[QF Auth] redirectUri =', redirectUri);
    console.log('[QF Auth] clientId =', QF_CLIENT_ID);
    console.log('[QF Auth] discovery =', JSON.stringify(QF_DISCOVERY));
    console.log('[QF Auth] request ready =', !!request);
    setSyncStatus('loading');
    try {
      const result = await promptAsync();
      console.log('[QF Auth] promptAsync result =', JSON.stringify(result));
      if (result.type !== 'success') {
        setSyncStatus('idle');
      }
    } catch (e: any) {
      console.log('[QF Auth] promptAsync ERROR =', e?.message, e?.stack);
      setSyncStatus('error');
      Alert.alert('Browser error', e?.message ?? 'Could not open login page');
    }
  }

  async function handleDisconnect() {
    Alert.alert('Disconnect', 'Remove Quran.com sync?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect', style: 'destructive', onPress: async () => {
          await clearTokens();
          setIsConnected(false);
          setQfStreak(null);
          setSyncStatus('idle');
        },
      },
    ]);
  }
  // ─────────────────────────────────────────────────────────────────────────

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
    //console.log('[notif] Scheduled notifications:', JSON.stringify(scheduled, null, 2));
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

        {/* Quran.com Sync Card */}
        <TouchableOpacity
          style={[styles.syncCard, isConnected && styles.syncCardConnected]}
          onPress={handleSync}
          onLongPress={isConnected ? handleDisconnect : undefined}
          activeOpacity={0.85}
          disabled={syncStatus === 'loading'}
        >
          <View style={[styles.syncIconWrap, isConnected && styles.syncIconWrapConnected]}>
            {syncStatus === 'loading'
              ? <ActivityIndicator size="small" color={isConnected ? '#fff' : '#2E7D32'} />
              : <Ionicons name={isConnected ? 'checkmark-circle' : 'sync-outline'} size={22} color={isConnected ? '#fff' : '#2E7D32'} />
            }
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.syncLabel, isConnected && styles.syncLabelConnected]}>
              {isConnected ? 'Synced with Quran.com' : 'Sync Streak with Quran.com'}
            </Text>
            <Text style={[styles.syncSub, isConnected && styles.syncSubConnected]}>
              {syncStatus === 'loading'
                ? 'Connecting…'
                : isConnected && qfStreak !== null
                ? (() => { const s = Math.max(streak, qfStreak); return `Quran.com streak: ${s} day${s !== 1 ? 's' : ''} 🔥  •  Hold to disconnect`; })()
                : isConnected
                ? 'Tap to refresh  •  Hold to disconnect'
                : 'Sign in with your Quran.com account'}
            </Text>
          </View>
          {!isConnected && (
            <Ionicons name="chevron-forward" size={18} color="#2E7D32" />
          )}
        </TouchableOpacity>

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
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  syncCardConnected: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  syncIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncIconWrapConnected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  syncLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  syncLabelConnected: { color: '#fff' },
  syncSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  syncSubConnected: { color: 'rgba(255,255,255,0.8)' },
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
