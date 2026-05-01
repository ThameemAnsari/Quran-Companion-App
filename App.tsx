import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/useAppStore';
import {
  evaluateAndSendNotification,
  scheduleSmartDailyReminder,
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

  // Build the context object used by both evaluate and schedule functions
  const ctx = {
    lastActiveDate,
    streak,
    selectedMood,
    lastNotificationTime,
    comebackSentDate,
    notificationsEnabled,
  };

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  // When the app opens:
  //   1. Cancel any pending scheduled notification (user is now active)
  //   2. Evaluate and send an immediate notification if conditions met
  //      (e.g. app opened at 9 PM after being inactive all day)
  useEffect(() => {
    (async () => {
      if (!notificationsEnabled) return;

      // Cancel the scheduled 8:30 PM reminder — user just opened the app
      await Notifications.cancelAllScheduledNotificationsAsync();

      const type = await evaluateAndSendNotification(ctx);
      if (type) {
        setLastNotificationTime(Date.now());
        if (type === 'comeback') {
          setComebackSentDate(new Date().toISOString().split('T')[0]);
        }
      }

      // Always re-schedule the 8:30 PM daily reminder after evaluation.
      // This ensures the notification fires even if the user force-kills the app
      // (swipe away from recents), because force-kill skips the AppState
      // background event entirely — so we can't rely on that alone.
      await scheduleSmartDailyReminder(ctx, 20, 30);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AppState transitions ──────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const wasActive = appState.current === 'active';
      const goingToBackground = nextState.match(/inactive|background/);
      const comingToForeground =
        appState.current.match(/inactive|background/) && nextState === 'active';

      if (wasActive && goingToBackground) {
        // App going to background → schedule the 8:30 PM real notification
        // so it fires even when the app is fully closed
        await scheduleSmartDailyReminder(ctx, 20, 30);
      }

      if (comingToForeground) {
        // App coming to foreground → user is now active, cancel scheduled reminder
        await Notifications.cancelAllScheduledNotificationsAsync();

        const type = await evaluateAndSendNotification(ctx);
        if (type) {
          setLastNotificationTime(Date.now());
          if (type === 'comeback') {
            setComebackSentDate(new Date().toISOString().split('T')[0]);
          }
        }
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, [lastActiveDate, streak, selectedMood, lastNotificationTime, comebackSentDate, notificationsEnabled]);

  // ── Handle tap on notification → navigate to Home ─────────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigation to Home is handled by deep link data: { screen: 'Home' }
      // AppNavigator will respond if deep linking is configured.
      // For now the app simply opens to its current state.
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
