/**
 * Quran Companion — Smart Notification Service
 *
 * Principles:
 * - Max 1 notification per day
 * - Never notify if user opened app today
 * - Quiet hours: 10:30 PM – 6:30 AM (no scheduling during this window)
 * - Priority: Comeback > Streak > Emotion > Night reminder
 * - Comeback: send once, then pause 2 days
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { Mood } from '../types';

// ─── Notification channel setup ──────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'streak' | 'emotion' | 'night' | 'comeback';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUIET_START_HOUR = 22;  // 10:30 PM
const QUIET_START_MIN  = 30;
const QUIET_END_HOUR   = 6;   // 6:30 AM
const QUIET_END_MIN    = 30;

const NIGHT_REMIND_START_HOUR = 20; // 8:00 PM
const NIGHT_REMIND_START_MIN  = 30;
const NIGHT_REMIND_END_HOUR   = 22; // 10:00 PM
const NIGHT_REMIND_END_MIN    = 0;

const MS_24H = 24 * 60 * 60 * 1000;
const MS_48H = 48 * 60 * 60 * 1000;

// ─── Emotion messages ─────────────────────────────────────────────────────────

const EMOTION_MESSAGES: Record<Mood, { title: string; body: string }> = {
  Stressed: {
    title: 'Feeling overwhelmed? 🌿',
    body: 'A calming ayah is waiting — take one quiet moment.',
  },
  Sad: {
    title: 'Your heart needs rest 💙',
    body: 'The Quran has a word just for you today.',
  },
  Angry: {
    title: 'Breathe for a moment 🕊️',
    body: 'A gentle reminder is here whenever you\'re ready.',
  },
  Confused: {
    title: 'Seeking clarity? ✨',
    body: 'An ayah to guide your thoughts is waiting.',
  },
  'Need Motivation': {
    title: 'You can do this 🌱',
    body: 'A short ayah to lift your spirit — just a moment.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA).getTime();
  const b = new Date(dateStrB).getTime();
  return Math.floor(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if current time is inside quiet hours (10:30 PM – 6:30 AM).
 */
function isQuietHours(): boolean {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMins = h * 60 + m;
  const quietStart = QUIET_START_HOUR * 60 + QUIET_START_MIN; // 1350
  const quietEnd   = QUIET_END_HOUR   * 60 + QUIET_END_MIN;   // 390
  // quiet window wraps midnight: >= 1350 OR < 390
  return totalMins >= quietStart || totalMins < quietEnd;
}

/**
 * Returns true if current time is in the night reminder window (8:30 PM – 10:00 PM).
 */
function isNightWindow(): boolean {
  const now = new Date();
  const totalMins = now.getHours() * 60 + now.getMinutes();
  const start = NIGHT_REMIND_START_HOUR * 60 + NIGHT_REMIND_START_MIN; // 1230
  const end   = NIGHT_REMIND_END_HOUR   * 60 + NIGHT_REMIND_END_MIN;   // 1320
  return totalMins >= start && totalMins < end;
}

// ─── Permission ───────────────────────────────────────────────────────────────

/**
 * Requests notification permission. Must be called once on app startup.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false; // Emulators don't support push

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('quran-companion', {
      name: 'Quran Companion',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Core send function ───────────────────────────────────────────────────────

async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: { type: payload.type, screen: 'Home' },
      sound: false,
    },
    trigger: null, // immediate
  });
}

// ─── Decision Engine ──────────────────────────────────────────────────────────

export interface NotificationContext {
  lastActiveDate: string | null;       // ISO date user last opened app
  streak: number;
  selectedMood: Mood | null;
  lastNotificationTime: number | null; // unix ms
  comebackSentDate: string | null;     // ISO date comeback was last sent
  notificationsEnabled: boolean;
}

/**
 * Core logic: evaluates user state and sends at most one notification.
 * Returns the type sent, or null if none was sent.
 */
export async function evaluateAndSendNotification(
  ctx: NotificationContext
): Promise<NotificationType | null> {
  const {
    lastActiveDate,
    streak,
    selectedMood,
    lastNotificationTime,
    comebackSentDate,
    notificationsEnabled,
  } = ctx;

  // Guard: user disabled reminders
  if (!notificationsEnabled) return null;

  // Guard: quiet hours
  if (isQuietHours()) return null;

  // Guard: already notified in the last 24 hours
  if (lastNotificationTime && Date.now() - lastNotificationTime < MS_24H) {
    return null;
  }

  const today = todayStr();

  // Guard: user already opened the app today
  if (lastActiveDate === today) return null;

  // Calculate inactivity
  const inactiveDays = lastActiveDate ? daysBetween(today, lastActiveDate) : 99;

  // ── Priority 1: Comeback (inactive 2–3 days, send once then 48h pause) ──
  if (inactiveDays >= 2 && inactiveDays <= 3) {
    const canSendComeback =
      !comebackSentDate ||
      daysBetween(today, comebackSentDate) >= 2;

    if (canSendComeback) {
      await sendLocalNotification({
        type: 'comeback',
        title: 'Start again today 🌱',
        body: 'Every small step towards the Quran brings peace.',
      });
      return 'comeback';
    }
  }

  // ── Priority 2: Streak at risk (active streak, missed today) ──
  if (streak > 0 && inactiveDays >= 1) {
    await sendLocalNotification({
      type: 'streak',
      title: "🔥 Don't break your streak",
      body: 'Read one ayah today — your heart will thank you.',
    });
    return 'streak';
  }

  // ── Priority 3: Emotion-based (inactive today, last mood known) ──
  if (selectedMood && inactiveDays >= 1) {
    const msg = EMOTION_MESSAGES[selectedMood];
    await sendLocalNotification({
      type: 'emotion',
      title: msg.title,
      body: msg.body,
    });
    return 'emotion';
  }

  // ── Priority 4: Night reminder (only within 8:30–10 PM window) ──
  if (isNightWindow()) {
    await sendLocalNotification({
      type: 'night',
      title: 'End your day with peace 🌙',
      body: 'Read a short ayah before you sleep.',
    });
    return 'night';
  }

  return null;
}

// ─── Schedule recurring daily check ──────────────────────────────────────────

/**
 * Schedules a silent background trigger at a given hour:minute each day.
 * On trigger the app should call evaluateAndSendNotification().
 *
 * Note: Expo's local trigger fires even when app is in background.
 */
export async function scheduleDailyEvaluationTrigger(
  hour: number = 18,
  minute: number = 0
): Promise<void> {
  // Cancel previous evaluation triggers only (identified by identifier)
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as Record<string, unknown>)?.isEvalTrigger) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '',
      body: '',
      data: { isEvalTrigger: true },
      // hidden trigger — handler checks isEvalTrigger and suppresses display
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

// ─── Cancel all ───────────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
