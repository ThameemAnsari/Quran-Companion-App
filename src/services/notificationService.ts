/**
 * Quran Companion — Smart Notification Service
 *
 * Principles:
 * - Max 1 notification per day
 * - Never notify if user opened app today
 * - Quiet hours: 10:00 PM – 5:30 AM (no scheduling during this window)
 * - Daily evaluation fires at 8:30 PM — inside the night window, before quiet hours
 * - Priority: Comeback > Streak > Emotion > Night reminder
 * - Streak warning: only on inactiveDays === 1 (today still saveable); resets if missed
 * - Comeback: send once, then pause 2 days
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import type { Mood } from '../types';

// ─── Notification channel setup ──────────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'streak' | 'emotion' | 'night' | 'comeback';

export interface NotificationPayload {
  type: NotificationType;
  /** Headline shown in both collapsed and expanded views */
  title: string;
  /** Richer line shown in expanded view (iOS subtitle / Android second line) */
  subtitle: string;
  /** Short body shown in collapsed view */
  body: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUIET_START_HOUR = 22;  // 10:00 PM
const QUIET_START_MIN  = 0;
const QUIET_END_HOUR   = 5;   // 5:30 AM
const QUIET_END_MIN    = 30;

const NIGHT_REMIND_START_HOUR = 20; // 8:00 PM
const NIGHT_REMIND_START_MIN  = 30;
const NIGHT_REMIND_END_HOUR   = 22; // 10:00 PM
const NIGHT_REMIND_END_MIN    = 0;

const MS_24H = 24 * 60 * 60 * 1000;

// ─── Emotion messages ─────────────────────────────────────────────────────────

const EMOTION_MESSAGES: Record<Mood, { title: string; subtitle: string; body: string }> = {
  Stressed: {
    title: 'Feeling overwhelmed?',
    subtitle: 'Take a moment for your heart.',
    body: 'A calming ayah is waiting for you. 🌿',
  },
  Sad: {
    title: 'Your heart needs rest 💙',
    subtitle: 'The Quran holds comfort for every sadness.',
    body: 'A gentle ayah is waiting for you.',
  },
  Angry: {
    title: 'Breathe for a moment 🕊️',
    subtitle: 'Let the Quran soften what feels heavy.',
    body: 'A calming reminder is here whenever you\'re ready.',
  },
  Confused: {
    title: 'Seeking clarity? ✨',
    subtitle: 'Let an ayah guide your thoughts today.',
    body: 'Open the app — your answer might be waiting.',
  },
  'Need Motivation': {
    title: 'You can do this 🌱',
    subtitle: 'A short ayah to lift your spirit.',
    body: 'Take one quiet moment — it\'s enough.',
  },
  Grateful: {
    title: 'A heart full of gratitude 🌸',
    subtitle: 'Reflect on Allah\'s blessings today.',
    body: 'Open the app and deepen your thankfulness.',
  },
  Lonely: {
    title: 'You are never alone 🥺',
    subtitle: 'Allah is closer than you think.',
    body: 'A comforting ayah is waiting for you.',
  },
  Fearful: {
    title: 'Find calm in His words 🤲',
    subtitle: 'Let the Quran ease what weighs on you.',
    body: 'Your peace is just one ayah away.',
  },
  'Seeking Forgiveness': {
    title: 'His mercy is vast 💚',
    subtitle: 'Turn back — He is always ready to forgive.',
    body: 'A reminder of His forgiveness awaits you.',
  },
  'Seeking Peace': {
    title: 'Stillness for your soul 😌',
    subtitle: 'Let an ayah bring you tranquility.',
    body: 'Take a breath — the Quran is here.',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = new Date(dateStrA).getTime();
  const b = new Date(dateStrB).getTime();
  return Math.floor(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Returns true if current time is inside quiet hours (10:00 PM – 5:30 AM).
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
  console.log('[notif] requestNotificationPermission: isDevice =', Device.isDevice, '| OS =', Platform.OS);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('quran-companion', {
      name: 'Quran Companion',
      importance: Notifications.AndroidImportance.HIGH,
      sound: null,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  console.log('[notif] existing permission status:', existing);
  if (existing === 'granted') {
    // On Android 12+ (API 31+) also request exact alarm permission so
    // notifications fire on time from killed/background state.
    if (Platform.OS === 'android' && Number(Platform.Version) >= 31) {
      await Notifications.requestPermissionsAsync({ android: { alarm: true } } as any);
    }
    return true;
  }

  // Request notification permission. On Android 12+, also request exact alarms —
  // this opens the "Alarms & Reminders" settings page so the user can grant it.
  const requestOptions =
    Platform.OS === 'android' && Number(Platform.Version) >= 31
      ? ({ android: { alarm: true } } as any)
      : {};

  const { status } = await Notifications.requestPermissionsAsync(requestOptions);
  console.log('[notif] after request, status:', status);
  return status === 'granted';
}

// ─── Core send function ───────────────────────────────────────────────────────

async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      // subtitle shows in iOS expanded view; on Android it appears as a second line
      subtitle: payload.subtitle,
      // body is the short collapsed line; on Android we append subtitle so
      // the expanded BigText view shows the richer message
      body: Platform.OS === 'android'
        ? `${payload.subtitle}\n${payload.body}`
        : payload.body,
      data: { type: payload.type, screen: 'Home' },
      sound: false,
    },
    trigger: null, // immediate
  });
}

// ─── Decision Engine ──────────────────────────────────────────────────────────

export interface NotificationContext {
  lastActiveDate: string | null;
  streak: number;
  selectedMood: Mood | null;
  lastNotificationTime: number | null;
  comebackSentDate: string | null;
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
        subtitle: "It's okay, we all take breaks.",
        body: 'Come back today and reconnect with the Quran.',
      });
      return 'comeback';
    }
  }

  // ── Priority 2: Streak at risk (missed TODAY only — still salvageable) ──
  // inactiveDays === 1 means the user last opened yesterday. Today is the
  // last chance to preserve the streak before it resets at midnight.
  // If inactiveDays >= 2 the streak is already broken — comeback handles that.
  if (streak > 0 && inactiveDays === 1) {
    await sendLocalNotification({
      type: 'streak',
      title: "You have been consistent with the Quran 🤍",
      subtitle: `You've built a 🔥 ${streak} day streak — Connect with the Quran today to maintain your streak!`,
      body: 'Open the app and read one ayah before midnight.',
    });
    return 'streak';
  }

  // ── Priority 3: Emotion-based (inactive today, last mood known) ──
  if (selectedMood && inactiveDays >= 1) {
    const msg = EMOTION_MESSAGES[selectedMood];
    await sendLocalNotification({
      type: 'emotion',
      title: msg.title,
      subtitle: msg.subtitle,
      body: msg.body,
    });
    return 'emotion';
  }

  // ── Priority 4: Night reminder (only within 8:30–10 PM window) ──
  if (isNightWindow()) {
    await sendLocalNotification({
      type: 'night',
      title: 'End your day with peace 🌙',
      subtitle: 'Let the words of Allah bring you peace tonight.',
      body: 'Read a short ayah before you sleep.',
    });
    return 'night';
  }

  return null;
}

// ─── Schedule smart daily reminder ───────────────────────────────────────────

/**
 * Schedules a REAL visible notification at the given hour:minute each day.
 * Content is personalised based on current user state (streak, mood, etc.).
 *
 * Call this when the app goes to background so the notification fires even
 * when the app is fully closed. Cancel it on foreground (user is already active).
 *
 * This replaces the previous silent isEvalTrigger approach which had two bugs:
 *   1. The silent notification showed a blank banner on Android
 *   2. Nobody called evaluateAndSendNotification() when the trigger fired
 */
export async function scheduleSmartDailyReminder(
  ctx: NotificationContext,
  hour: number = 20,   // 8:30 PM — before quiet hours at 10 PM
  minute: number = 30
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!ctx.notificationsEnabled) return;

  // Pick personalised content based on user state
  const today = todayStr();
  const inactiveDays = ctx.lastActiveDate ? daysBetween(today, ctx.lastActiveDate) : 1;

  let title: string;
  let subtitle: string;
  let body: string;
  let type: NotificationType;

  // Streak warning: only fire on inactiveDays === 1 — the single day the streak
  // is still saveable. If inactiveDays >= 2 the streak is already broken; use
  // emotion/night messaging instead. The store resets streak to 1 on next open.
  if (ctx.streak > 0 && inactiveDays === 1) {
    type = 'streak';
    title = "🔥 Don't break your streak!";
    subtitle = `You've built a ${ctx.streak}-day streak — Keep it alive by connecting with the Quran today!`;
    body = 'Open the app and read one ayah before midnight to maintain your streak.';
  } else if (ctx.selectedMood && EMOTION_MESSAGES[ctx.selectedMood]) {
    type = 'emotion';
    ({ title, subtitle, body } = EMOTION_MESSAGES[ctx.selectedMood]);
  } else {
    type = 'night';
    title = 'Your daily Quran reminder 🌙';
    subtitle = 'A moment with the Quran can change your whole evening.';
    body = 'Read a short ayah before you sleep.';
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      subtitle,
      body: Platform.OS === 'android' ? `${subtitle}\n${body}` : body,
      data: { type, screen: 'Home' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      channelId: Platform.OS === 'android' ? 'quran-companion' : undefined,
      hour,
      minute,
    },
  });
}

// ─── Cancel all ───────────────────────────────────────────────────────────────

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Test function to verify notifications work at all (sends after 10s) ──
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test',
      body: 'Notifications are working ✓',
      data: { screen: 'Home' },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      channelId: Platform.OS === 'android' ? 'quran-companion' : undefined,
      seconds: 15,
      repeats: false,
    },
  });
  console.log('[notif] Test notification scheduled — fire in 15s');
}
