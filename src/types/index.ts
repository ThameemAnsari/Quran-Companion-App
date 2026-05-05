// ─── Quran API Types ─────────────────────────────────────────────────────────

export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  verses_count: number;
  revelation_place: string;
}

export interface Translation {
  id: number;
  resource_id: number;
  text: string;
}

export interface Word {
  id: number;
  text_uthmani: string;
  translation: { text: string };
}

export interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  words: Word[];
  translations: Translation[];
}

export interface SearchResult {
  verse_key: string;
  text: string;
  translations: Array<{ text: string }>;
}

// ─── App Domain Types ─────────────────────────────────────────────────────────

export interface Ayah {
  id: number;
  verseKey: string;       // e.g. "3:139"
  surahName: string;
  surahNumber: number;
  verseNumber: number;
  arabicText: string;
  translation: string;
  audioUrl: string;
  theme?: string;
  explanation?: string;
  savedAt?: string;        // ISO date string set when bookmarked
}

export interface Reflection {
  id: string;
  ayah: Ayah;
  lesson: string;
  application: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  emoji: string;
  ayahs: Ayah[];
  createdAt: string;
  lastOpenedAt: string;
}

export interface WeekStats {
  ayahsRead: number;
  reflections: number;
  bookmarks: number;
  timeSpentMinutes: number;
}

export type Mood =
  | 'Stressed'
  | 'Sad'
  | 'Angry'
  | 'Confused'
  | 'Need Motivation'
  | 'Grateful'
  | 'Lonely'
  | 'Fearful'
  | 'Seeking Forgiveness'
  | 'Seeking Peace';

export interface MoodOption {
  label: Mood;
  emoji: string;
  color: string;
  bgColor: string;
  keywords: string[];
  theme: string;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Home: undefined;
  Loading: { mood: Mood };
  Main: undefined;
  Reflection: { ayah: Ayah };
  CollectionDetail: { collectionId: string };
  CreateCollection: { ayahToAdd?: Ayah };
};

export type MainTabParamList = {
  ForYou: undefined;
  Collections: undefined;
  Progress: undefined;
  Profile: undefined;
};
