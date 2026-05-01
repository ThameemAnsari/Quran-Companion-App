import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ayah, Mood, Reflection, WeekStats, Collection } from '../types';
import { fetchMoreAyahsForMood } from '../services/aiService';

interface AppState {
  // ── mood & current ayah
  selectedMood: Mood | null;
  currentAyah: Ayah | null;
  ayahList: Ayah[];
  ayahIndex: number;
  fetchAttempt: number;
  hasMoreAyahs: boolean;
  isFetchingMore: boolean;

  // ── collections
  collections: Collection[];

  // ── bookmarks
  bookmarks: Ayah[];

  // ── reflections
  reflections: Reflection[];

  // ── progress / streak
  streak: number;
  lastActiveDate: string | null;
  weekStats: WeekStats;
  /** Per-day stats keyed by ISO date string "YYYY-MM-DD" */
  dailyStats: Record<string, WeekStats>;

  // ── notifications
  /** Unix timestamp (ms) of the last notification sent */
  lastNotificationTime: number | null;
  /** ISO date of the comeback notification send — for 2-day pause logic */
  comebackSentDate: string | null;
  /** Whether the user enabled daily reminders in Profile settings */
  notificationsEnabled: boolean;
  /** Whether we've already shown the pre-permission screen (show only once) */
  permissionScreenShown: boolean;
  /** ISO date user tapped "Maybe Later" — used for 2-day re-ask cooldown */
  permissionDeniedDate: string | null;

  // ── actions
  setMood: (mood: Mood) => void;
  setCurrentAyah: (ayah: Ayah) => void;
  setAyahList: (ayahs: Ayah[]) => void;
  nextAyah: () => void;

  addBookmark: (ayah: Ayah) => void;
  removeBookmark: (verseKey: string) => void;
  isBookmarked: (verseKey: string) => boolean;

  addReflection: (reflection: Reflection) => void;

  createCollection: (name: string, emoji: string) => Collection;
  addAyahToCollection: (collectionId: string, ayah: Ayah) => void;
  removeAyahFromCollection: (collectionId: string, verseKey: string) => void;
  deleteCollection: (collectionId: string) => void;
  touchCollection: (collectionId: string) => void;

  incrementAyahsRead: () => void;
  addTimeSpent: (minutes: number) => void;
  checkAndUpdateStreak: () => void;
  getDayStats: (dateStr: string) => WeekStats;

  // ── notification actions
  setLastNotificationTime: (ts: number) => void;
  setComebackSentDate: (date: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPermissionScreenShown: (shown: boolean) => void;
  setPermissionDeniedDate: (date: string | null) => void;
}

const todayStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedMood: null,
      currentAyah: null,
      ayahList: [],
      ayahIndex: 0,
      fetchAttempt: 0,
      hasMoreAyahs: true,
      isFetchingMore: false,
      bookmarks: [],
      collections: [],
      reflections: [],
      streak: 0,
      lastActiveDate: null,
      weekStats: {
        ayahsRead: 0,
        reflections: 0,
        bookmarks: 0,
        timeSpentMinutes: 0,
      },
      dailyStats: {},
      lastNotificationTime: null,
      comebackSentDate: null,
      notificationsEnabled: false,
      permissionScreenShown: false,
      permissionDeniedDate: null,

      setMood: (mood) => set({ selectedMood: mood }),

      setCurrentAyah: (ayah) => set({ currentAyah: ayah }),

      setAyahList: (ayahs) => {
        const seen = new Set<string>();
        const unique = ayahs.filter((a) => !seen.has(a.verseKey) && !!seen.add(a.verseKey));
        set({ ayahList: unique, currentAyah: unique[0] ?? null, ayahIndex: 0, fetchAttempt: 0, hasMoreAyahs: true, isFetchingMore: false });
      },

      nextAyah: async () => {
        const { ayahList, ayahIndex, hasMoreAyahs, isFetchingMore, selectedMood, fetchAttempt } = get();
        if (ayahList.length === 0) return;

        const isAtEnd = ayahIndex >= ayahList.length - 1;
        const nextIdx = isAtEnd ? 0 : ayahIndex + 1;
        set({ currentAyah: ayahList[nextIdx], ayahIndex: nextIdx });

        // Pre-fetch when 3 ayahs from end (or at end) so new ayahs are ready before cycling repeats
        const nearEnd = ayahIndex >= ayahList.length - 4;
        if (nearEnd && hasMoreAyahs && !isFetchingMore && selectedMood) {
          set({ isFetchingMore: true });
          try {
            const { ayahList: currentList } = get();
            const existingKeys = new Set(currentList.map((a) => a.verseKey));
            const { ayahs: fresh, nextAttempt, exhausted } = await fetchMoreAyahsForMood(
              selectedMood,
              fetchAttempt,
              existingKeys,
            );
            const { ayahList: latestList } = get();
            set({
              ayahList: fresh.length > 0 ? [...latestList, ...fresh] : latestList,
              fetchAttempt: nextAttempt,
              hasMoreAyahs: !exhausted,
              isFetchingMore: false,
            });
          } catch {
            set({ isFetchingMore: false });
          }
        }
        // incrementAyahsRead is called by AyahScreen's useEffect — don't call it here too
      },

      addBookmark: (ayah) => {
        const { bookmarks, weekStats, dailyStats } = get();
        if (bookmarks.find((b) => b.verseKey === ayah.verseKey)) return;
        const today = todayStr();
        const prev = dailyStats[today] ?? { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };
        set({
          bookmarks: [...bookmarks, { ...ayah, savedAt: today }],
          weekStats: { ...weekStats, bookmarks: weekStats.bookmarks + 1 },
          dailyStats: { ...dailyStats, [today]: { ...prev, bookmarks: prev.bookmarks + 1 } },
        });
      },

      removeBookmark: (verseKey) =>
        set((s) => {
          const exists = s.bookmarks.some((b) => b.verseKey === verseKey);
          if (!exists) return {};
          const today = todayStr();
          const prev = s.dailyStats[today];
          return {
            bookmarks: s.bookmarks.filter((b) => b.verseKey !== verseKey),
            weekStats: { ...s.weekStats, bookmarks: Math.max(0, s.weekStats.bookmarks - 1) },
            dailyStats: prev
              ? { ...s.dailyStats, [today]: { ...prev, bookmarks: Math.max(0, prev.bookmarks - 1) } }
              : s.dailyStats,
          };
        }),

      isBookmarked: (verseKey) =>
        get().bookmarks.some((b) => b.verseKey === verseKey),

      addReflection: (reflection) =>
        set((s) => {
          const today = todayStr();
          const prev = s.dailyStats[today] ?? { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };
          return {
            reflections: [reflection, ...s.reflections],
            weekStats: { ...s.weekStats, reflections: s.weekStats.reflections + 1 },
            dailyStats: { ...s.dailyStats, [today]: { ...prev, reflections: prev.reflections + 1 } },
          };
        }),

      createCollection: (name, emoji) => {
        const newCol: Collection = {
          id: `col-${Date.now()}`,
          name,
          emoji,
          ayahs: [],
          createdAt: new Date().toISOString(),
          lastOpenedAt: new Date().toISOString(),
        };
        set((s) => ({ collections: [newCol, ...s.collections] }));
        return newCol;
      },

      addAyahToCollection: (collectionId, ayah) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : c.ayahs.find((a) => a.verseKey === ayah.verseKey)
              ? c
              : { ...c, ayahs: [...c.ayahs, ayah] }
          ),
        })),

      removeAyahFromCollection: (collectionId, verseKey) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id !== collectionId
              ? c
              : { ...c, ayahs: c.ayahs.filter((a) => a.verseKey !== verseKey) }
          ),
        })),

      deleteCollection: (collectionId) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== collectionId) })),

      touchCollection: (collectionId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === collectionId ? { ...c, lastOpenedAt: new Date().toISOString() } : c
          ),
        })),

      incrementAyahsRead: () =>
        set((s) => {
          const today = todayStr();
          const prev = s.dailyStats[today] ?? { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };
          return {
            weekStats: { ...s.weekStats, ayahsRead: s.weekStats.ayahsRead + 1 },
            dailyStats: { ...s.dailyStats, [today]: { ...prev, ayahsRead: prev.ayahsRead + 1 } },
          };
        }),

      addTimeSpent: (minutes: number) =>
        set((s) => {
          const today = todayStr();
          const prev = s.dailyStats[today] ?? { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };
          return {
            weekStats: { ...s.weekStats, timeSpentMinutes: s.weekStats.timeSpentMinutes + minutes },
            dailyStats: { ...s.dailyStats, [today]: { ...prev, timeSpentMinutes: prev.timeSpentMinutes + minutes } },
          };
        }),

      checkAndUpdateStreak: () => {
        const { lastActiveDate, streak } = get();
        const today = todayStr();
        if (lastActiveDate === today) return;

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.getFullYear();
        const mo = String(yesterday.getMonth() + 1).padStart(2, '0');
        const dy = String(yesterday.getDate()).padStart(2, '0');
        const yesterdayStr = `${y}-${mo}-${dy}`;

        const newStreak =
          lastActiveDate === yesterdayStr ? streak + 1 : 1;

        set({ streak: newStreak, lastActiveDate: today });
      },

      getDayStats: (dateStr: string) => {
        const { dailyStats } = get();
        return dailyStats[dateStr] ?? { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };
      },

      setLastNotificationTime: (ts) => set({ lastNotificationTime: ts }),
      setComebackSentDate: (date) => set({ comebackSentDate: date }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setPermissionScreenShown: (shown) => set({ permissionScreenShown: shown }),
      setPermissionDeniedDate: (date) => set({ permissionDeniedDate: date }),
    }),
    {
      name: 'quran-companion-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        bookmarks: s.bookmarks,
        reflections: s.reflections,
        streak: s.streak,
        lastActiveDate: s.lastActiveDate,
        weekStats: s.weekStats,
        dailyStats: s.dailyStats,
        lastNotificationTime: s.lastNotificationTime,
        comebackSentDate: s.comebackSentDate,
        notificationsEnabled: s.notificationsEnabled,
        permissionScreenShown: s.permissionScreenShown,
        permissionDeniedDate: s.permissionDeniedDate,
      }),
    }
  )
);
