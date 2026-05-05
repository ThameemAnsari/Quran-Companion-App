import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import {
  evaluateAndSendNotification,
  scheduleSmartDailyReminder,
  scheduleTestNotification,
} from './src/services/notificationService';

function NotificationBootstrap() {
  const {
    lastActiveDate,
    streak,
    selectedMood,
    lastNotificationTime,
    comebackSentDate,
    notificationsEnabled,
    setLastNotificationTime,
    setComebackSentDate,
  } = useAppStore();

  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Always-fresh ctx via ref — avoids stale closure in async callbacks
  const ctxRef = useRef({
    lastActiveDate,
    streak,
    selectedMood,
    lastNotificationTime,
    comebackSentDate,
    notificationsEnabled,
  });
  ctxRef.current = {
    lastActiveDate,
    streak,
    selectedMood,
    lastNotificationTime,
    comebackSentDate,
    notificationsEnabled,
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  // Depends on notificationsEnabled so it runs AFTER AsyncStorage hydrates
  // (store initialises with notificationsEnabled=false, turns true once
  //  persist middleware rehydrates from AsyncStorage on first render cycle).
  const hasBootstrapped = useRef(false);
  useEffect(() => {
    console.log('[bootstrap] notificationsEnabled =', notificationsEnabled, '| alreadyRan =', hasBootstrapped.current);
    if (!notificationsEnabled) return;
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    (async () => {
      console.log('[bootstrap] body running...');
      // Ensure Android channel exists (idempotent — safe to call every boot)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('quran-companion', {
          name: 'Quran Companion',
          importance: Notifications.AndroidImportance.HIGH,
          sound: null,
        });
      }

      // Cancel stale scheduled reminder — user is currently active
      await Notifications.cancelAllScheduledNotificationsAsync();

      // TEMP TEST: fires 10s after app open to confirm notifications work
      //await scheduleTestNotification();

      const ctx = ctxRef.current;
      const type = await evaluateAndSendNotification(ctx);
      if (type) {
        setLastNotificationTime(Date.now());
        if (type === 'comeback') {
          const n = new Date();
          setComebackSentDate(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`);
        }
      }

      // Schedule 8:30 PM reminder so it fires even after force-kill
      await scheduleSmartDailyReminder(ctx, 20, 30);
    })();
  }, [notificationsEnabled]); // re-runs when store hydrates from AsyncStorage

  // ── AppState transitions ──────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const wasActive = appState.current === 'active';
      const goingToBackground = nextState.match(/inactive|background/);
      const comingToForeground =
        appState.current.match(/inactive|background/) && nextState === 'active';

      const ctx = ctxRef.current; // always fresh

      if (wasActive && goingToBackground) {
        // Going to background → (re)schedule 8:30 PM so it fires when closed
        await scheduleSmartDailyReminder(ctx, 20, 30);
      }

      if (comingToForeground) {
        // Coming to foreground → user is active; cancel scheduled reminder
        await Notifications.cancelAllScheduledNotificationsAsync();

        const type = await evaluateAndSendNotification(ctx);
        if (type) {
          setLastNotificationTime(Date.now());
          if (type === 'comeback') {
            const n = new Date();
            setComebackSentDate(`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`);
          }
        }
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, []); // ctxRef.current is always fresh — no deps needed

  // ── Handle tap on notification → navigate to Home ─────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigation to Home is handled by deep link data: { screen: 'Home' }
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NotificationBootstrap />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
