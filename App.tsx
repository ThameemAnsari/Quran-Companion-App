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
  scheduleDailyEvaluationTrigger,
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

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Only evaluate/schedule if user has already granted permission via the
      // pre-permission screen (notificationsEnabled = true in store).
      if (!notificationsEnabled) return;

      // Ensure daily trigger is registered after every fresh app install
      await scheduleDailyEvaluationTrigger(18, 0);

      const type = await evaluateAndSendNotification({
        lastActiveDate,
        streak,
        selectedMood,
        lastNotificationTime,
        comebackSentDate,
        notificationsEnabled,
      });

      if (type) {
        setLastNotificationTime(Date.now());
        if (type === 'comeback') {
          setComebackSentDate(new Date().toISOString().split('T')[0]);
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-evaluate when app comes to foreground from background ─────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        const type = await evaluateAndSendNotification({
          lastActiveDate,
          streak,
          selectedMood,
          lastNotificationTime,
          comebackSentDate,
          notificationsEnabled,
        });

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
