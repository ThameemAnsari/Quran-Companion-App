import axios from 'axios';
import Constants from 'expo-constants';
import type { Ayah, Verse, Chapter } from '../types';

// ─── Base config ──────────────────────────────────────────────────────────────
const BASE = 'https://api.quran.com/api/v4/';
const DEFAULT_TRANSLATION_ID = 85;  // M.A.S. Abdel Haleem — English (verified ID)
const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio/128/ar.alafasy';

// ─── Quran Foundation Search API ─────────────────────────────────────────────
// The @quranjs/api SDK hardcodes scope=content in its token request, but the
// Search API requires scope=search. We fetch the token manually here.
const QF_AUTH_URL    = 'https://oauth2.quran.foundation/oauth2/token';
const QF_SEARCH_URL  = 'https://apis.quran.foundation/search/v1/search';
const QF_CONTENT_URL = 'https://apis.quran.foundation/content/api/v4';

// ─── Token caches (separate per scope) ───────────────────────────────────────
let _searchTokenCache:  { value: string; expiresAt: number } | null = null;
let _contentTokenCache: { value: string; expiresAt: number } | null = null;

async function getToken(scope: 'search' | 'content'): Promise<string> {
  const cache = scope === 'search' ? _searchTokenCache : _contentTokenCache;
  if (cache && Date.now() < cache.expiresAt - 60_000) return cache.value;

  const clientId     = Constants.expoConfig?.extra?.quranClientId as string;
  const clientSecret = Constants.expoConfig?.extra?.quranClientSecret as string;
  const credentials  = btoa(`${clientId}:${clientSecret}`);

  const res = await axios.post(
    QF_AUTH_URL,
    `grant_type=client_credentials&scope=${scope}`,
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10_000,
    }
  );

  const entry = {
    value: res.data.access_token,
    expiresAt: Date.now() + (res.data.expires_in as number) * 1000,
  };
  if (scope === 'search') _searchTokenCache = entry;
  else _contentTokenCache = entry;
  return entry.value;
}

const getSearchToken  = () => getToken('search');
const getContentToken = () => getToken('content');

const api = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { Accept: 'application/json' },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verse counts per surah (index 0 = Surah 1). Used to compute the global
 * verse ID required by cdn.islamic.network.
 * Total = 6236  (verified against api.quran.com chapter list)
 */
const SURAH_VERSE_COUNTS = [
   7, 286, 200, 176, 120, 165, 206,  75, 129, 109,  // 1-10
 123, 111,  43,  52,  99, 128, 111, 110,  98, 135,  // 11-20
 112,  78, 118,  64,  77, 227,  93,  88,  69,  60,  // 21-30
  34,  30,  73,  54,  45,  83, 182,  88,  75,  85,  // 31-40
  54,  53,  89,  59,  37,  35,  38,  29,  18,  45,  // 41-50
  60,  49,  62,  55,  78,  96,  29,  22,  24,  13,  // 51-60
  14,  11,  11,  18,  12,  12,  30,  52,  52,  44,  // 61-70
  28,  28,  20,  56,  40,  31,  50,  40,  46,  42,  // 71-80
  29,  19,  36,  25,  22,  17,  19,  26,  30,  20,  // 81-90
  15,  21,  11,   8,   8,  19,   5,   8,   8,  11,  // 91-100
  11,   8,   3,   9,   5,   4,   7,   3,   6,   3,  // 101-110
   5,   4,   5,   6,                                 // 111-114
];

/** Convert surah + verse to global verse ID (1-based, used by cdn.islamic.network) */
const toGlobalVerseId = (surahNo: number, verseNo: number): number => {
  let id = 0;
  for (let i = 0; i < surahNo - 1; i++) id += SURAH_VERSE_COUNTS[i];
  return id + verseNo;
};

/** Build Mishary Alafasy MP3 URL via cdn.islamic.network */
export const buildAudioUrl = (surahNo: number, verseNo: number): string =>
  `${AUDIO_CDN}/${toGlobalVerseId(surahNo, verseNo)}.mp3`;

/** Convert raw API Verse → app Ayah */
const toAyah = (verse: Verse, chapterName: string, theme?: string): Ayah => ({
  id: verse.id,
  verseKey: verse.verse_key,
  surahName: chapterName,
  surahNumber: parseInt(verse.verse_key.split(':')[0], 10),
  verseNumber: verse.verse_number,
  arabicText: verse.text_uthmani,
  translation: verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '',
  audioUrl: buildAudioUrl(
    parseInt(verse.verse_key.split(':')[0], 10),
    verse.verse_number
  ),
  theme,
});

// ─── Language / Translation resources ────────────────────────────────────────

/**
 * A single entry shown in the language picker — one language, best translation.
 */
export interface LanguageOption {
  id: number;           // quran.com translation resource ID
  language: string;     // clean display name e.g. "English", "Tamil"
}

/**
 * Best (most authoritative) translation ID per language_name as returned by
 * GET /api/v4/resources/translations.  All IDs verified against the live API.
 */
const LANGUAGE_TRANSLATION_MAP: Record<string, { display: string; id: number }> = {
  english:          { display: 'English',            id: 85  }, // M.A.S. Abdel Haleem
  arabic:           { display: 'Arabic',             id: 16  }, // King Fahad Complex
  urdu:             { display: 'Urdu',               id: 97  }, // Tafheem - Maududi
  french:           { display: 'French',             id: 136 }, // Montada Islamic Foundation
  persian:          { display: 'Persian (Farsi)',    id: 135 }, // IslamHouse.com
  turkish:          { display: 'Turkish',            id: 77  }, // Diyanet Isleri
  german:           { display: 'German',             id: 27  }, // Frank Bubenheim & Nadeem
  spanish:          { display: 'Spanish',            id: 83  }, // Sheikh Isa Garcia
  indonesian:       { display: 'Indonesian',         id: 134 }, // King Fahad Quran Complex
  malay:            { display: 'Malay',              id: 39  }, // Abdullah Muhammad Basmeih
  russian:          { display: 'Russian',            id: 45  }, // Elmir Kuliev
  bengali:          { display: 'Bengali',            id: 161 }, // Taisirul Quran
  tamil:            { display: 'Tamil',              id: 229 }, // Sheikh Omar Sharif
  hindi:            { display: 'Hindi',              id: 122 }, // Maulana Azizul Haque al-Umari
  chinese:          { display: 'Chinese',            id: 56  }, // Ma Jian (Simplified)
  malayalam:        { display: 'Malayalam',          id: 37  }, // Abdul Hameed & Kunhi
  italian:          { display: 'Italian',            id: 153 }, // Hamza Roberto Piccardo
  dutch:            { display: 'Dutch',              id: 235 }, // Malak Faris Abdalsalaam
  portuguese:       { display: 'Portuguese',         id: 103 }, // Helmi Nasr
  japanese:         { display: 'Japanese',           id: 35  }, // Ryoichi Mita
  korean:           { display: 'Korean',             id: 36  },
  tagalog:          { display: 'Filipino (Tagalog)', id: 211 }, // Dar Al-Salam Center
  swahili:          { display: 'Swahili',            id: 49  }, // Ali Muhsin Al-Barwani
  hausa:            { display: 'Hausa',              id: 32  }, // Abubakar Gumi
  bosnian:          { display: 'Bosnian',            id: 25  }, // Muhamed Mehanović
  albanian:         { display: 'Albanian',           id: 88  }, // Hasan Efendi Nahi
  swedish:          { display: 'Swedish',            id: 48  }, // Knut Bernström
  polish:           { display: 'Polish',             id: 42  }, // Józef Bielawski
  thai:             { display: 'Thai',               id: 51  }, // King Fahad Quran Complex
  uzbek:            { display: 'Uzbek',              id: 55  }, // Muhammad Sodiq Yusuf
  kazakh:           { display: 'Kazakh',             id: 113 }, // Khalifah Altai
  vietnamese:       { display: 'Vietnamese',         id: 220 }, // Translation Pioneers Center
  ukrainian:        { display: 'Ukrainian',          id: 217 }, // Dr. Mikhailo Yaqubovic
  pashto:           { display: 'Pashto',             id: 118 }, // Zakaria Abulsalam
  telugu:           { display: 'Telugu',             id: 227 }, // Maulana Abder-Rahim
  gujarati:         { display: 'Gujarati',           id: 225 }, // Rabila Al-Umry
  marathi:          { display: 'Marathi',            id: 226 }, // Muhammad Shafi'i Ansari
  kannada:          { display: 'Kannada',            id: 771 },
  sindhi:           { display: 'Sindhi',             id: 238 }, // Taj Mehmood Amroti
  nepali:           { display: 'Nepali',             id: 108 }, // Ahl Al-Hadith Central Society
  somali:           { display: 'Somali',             id: 46  }, // Mahmud Muhammad Abduh
  yoruba:           { display: 'Yoruba',             id: 125 }, // Shaykh Abu Rahimah
  amharic:          { display: 'Amharic',            id: 87  }, // Sadiq and Sani
  azeri:            { display: 'Azerbaijani',        id: 75  }, // Alikhan Musayev
  romanian:         { display: 'Romanian',           id: 44  }, // George Grigore
  czech:            { display: 'Czech',              id: 26  },
  norwegian:        { display: 'Norwegian',          id: 41  },
  finnish:          { display: 'Finnish',            id: 30  },
  bulgarian:        { display: 'Bulgarian',          id: 237 }, // Tzvetan Theophanov
  hebrew:           { display: 'Hebrew',             id: 233 }, // Dar Al-Salam Center
  assamese:         { display: 'Assamese',           id: 120 }, // Shaykh Rafeequl Islam
  tajik:            { display: 'Tajik',              id: 74  },
  tatar:            { display: 'Tatar',              id: 53  },
  kurdish:          { display: 'Kurdish',            id: 81  }, // Burhan Muhammad-Amin
  dari:             { display: 'Dari',               id: 785 }, // Mawlawi Muhammad Anwar Badkhashani
  sinhala:          { display: 'Sinhala',            id: 228 }, // Translation Pioneers Center
  chechen:          { display: 'Chechen',            id: 106 }, // Magomed Magomedov
  kinyarwanda:      { display: 'Kinyarwanda',        id: 774 }, // Rwanda Muslims Association
  bambara:          { display: 'Bambara',            id: 795 }, // Suliman Kanti
  ganda:            { display: 'Luganda',            id: 232 }, // African Development Foundation
};

let _languagesCache: LanguageOption[] | null = null;

/**
 * Returns one LanguageOption per language supported by the Quran.com API,
 * using verified preferred translation IDs. Results are cached per session.
 * Falls back to a static list if the network is unavailable.
 */
export async function fetchLanguages(): Promise<LanguageOption[]> {
  if (_languagesCache) return _languagesCache;

  try {
    const res = await api.get('resources/translations', { params: { language: 'en' } });
    const raw: Array<{ id: number; language_name: string }> = res.data?.translations ?? [];

    const seen = new Set<string>();
    const result: LanguageOption[] = [];

    for (const t of raw) {
      // API language_name may be "divehi, dhivehi, maldivian" — normalise to first word
      const key = t.language_name.toLowerCase().split(',')[0].trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const mapping = LANGUAGE_TRANSLATION_MAP[key];
      if (mapping) {
        result.push({ id: mapping.id, language: mapping.display });
      }
      // Skip languages not in our map (very obscure/unverified IDs)
    }

    // Sort alphabetically, English always first
    result.sort((a, b) => {
      if (a.language === 'English') return -1;
      if (b.language === 'English') return 1;
      return a.language.localeCompare(b.language);
    });

    _languagesCache = result;
    return result;
  } catch (err) {
    console.warn('[quranApi] fetchLanguages error — using static fallback:', err);
    // Static fallback with the most common languages
    _languagesCache = [
      { id: 85,  language: 'English' },
      { id: 87,  language: 'Amharic' },
      { id: 75,  language: 'Azerbaijani' },
      { id: 161, language: 'Bengali' },
      { id: 25,  language: 'Bosnian' },
      { id: 56,  language: 'Chinese' },
      { id: 27,  language: 'German' },
      { id: 225, language: 'Gujarati' },
      { id: 32,  language: 'Hausa' },
      { id: 122, language: 'Hindi' },
      { id: 134, language: 'Indonesian' },
      { id: 35,  language: 'Japanese' },
      { id: 113, language: 'Kazakh' },
      { id: 771, language: 'Kannada' },
      { id: 36,  language: 'Korean' },
      { id: 39,  language: 'Malay' },
      { id: 37,  language: 'Malayalam' },
      { id: 226, language: 'Marathi' },
      { id: 108, language: 'Nepali' },
      { id: 118, language: 'Pashto' },
      { id: 135, language: 'Persian (Farsi)' },
      { id: 211, language: 'Filipino (Tagalog)' },
      { id: 42,  language: 'Polish' },
      { id: 103, language: 'Portuguese' },
      { id: 45,  language: 'Russian' },
      { id: 238, language: 'Sindhi' },
      { id: 46,  language: 'Somali' },
      { id: 83,  language: 'Spanish' },
      { id: 49,  language: 'Swahili' },
      { id: 229, language: 'Tamil' },
      { id: 227, language: 'Telugu' },
      { id: 51,  language: 'Thai' },
      { id: 77,  language: 'Turkish' },
      { id: 217, language: 'Ukrainian' },
      { id: 97,  language: 'Urdu' },
      { id: 55,  language: 'Uzbek' },
      { id: 220, language: 'Vietnamese' },
      { id: 125, language: 'Yoruba' },
    ];
    return _languagesCache;
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const chapterCache: Map<number, Chapter> = new Map();

export async function fetchChapter(id: number): Promise<Chapter> {
  if (chapterCache.has(id)) return chapterCache.get(id)!;
  const res = await api.get(`chapters/${id}`, { params: { language: 'en' } });
  const chapter: Chapter = res.data.chapter;
  chapterCache.set(id, chapter);
  return chapter;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Lightweight probe: fetches page=1, size=1 just to read pagination.total_pages.
 * Used before building the shuffle deck so the cap is always accurate.
 */
export async function probeTotalPages(query: string): Promise<number> {
  try {
    const clientId = Constants.expoConfig?.extra?.quranClientId as string;
    const token    = await getSearchToken();
    const res = await axios.get(QF_SEARCH_URL, {
      params: { mode: 'advanced', query, page: 1, size: 10, get_text: '0' },
      headers: {
        'x-auth-token': token,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 8_000,
    });
    return res.data?.pagination?.total_pages ?? 20;
  } catch {
    return 20; // safe fallback
  }
}

export async function searchAyahs(
  query: string,
  theme?: string,
  size = 10,
  page = 1,
  translationId: number = DEFAULT_TRANSLATION_ID
): Promise<{ ayahs: Ayah[]; totalPages: number }> {
  try {
    const clientId = Constants.expoConfig?.extra?.quranClientId as string;
    const token    = await getSearchToken();

    console.log('[quranApi] searchAyahs query:', query, 'page:', page);

    const res = await axios.get(QF_SEARCH_URL, {
      params: {
        mode: 'advanced',
        query,
        page,
        size,
        translation_ids: `${translationId}`,
        get_text: '1',
        highlight: '0',
      },
      headers: {
        'x-auth-token': token,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 15_000,
    });

    console.log('[quranApi] response pagination:', JSON.stringify(res.data?.pagination));
    console.log('[quranApi] response verses:', JSON.stringify(res.data?.result));

    const verses: Array<{
      key: string;
      arabic?: string;
      name?: string;
      result_type?: string;
    }> = res.data?.result?.verses ?? [];

    const ayahs: Ayah[] = await Promise.all(
      verses.slice(0, 8).map(async (v) => {
        const [surahNo, verseNo] = v.key.split(':').map(Number);

        // Fetch the actual translation from quran.com API using the selected translationId.
        // The QF search API's v.name is only the search-match snippet (always English),
        // so we must re-fetch to get the correct language translation.
        try {
          const [verseRes, chapter] = await Promise.all([
            api.get(`verses/by_key/${v.key}`, {
              params: { language: 'en', words: false, translations: translationId },
            }),
            fetchChapter(surahNo),
          ]);
          const verseData: Verse = verseRes.data?.verse;
          return {
            id: surahNo * 1000 + verseNo,
            verseKey: v.key,
            surahName: chapter.name_simple,
            surahNumber: surahNo,
            verseNumber: verseNo,
            arabicText: verseData?.text_uthmani ?? v.arabic ?? '',
            translation: verseData?.translations?.[0]?.text?.replace(/<[^>]*>/g, '') ?? '',
            audioUrl: buildAudioUrl(surahNo, verseNo),
            theme,
          };
        } catch {
          // Fallback: use search snippet (English) if quran.com verse fetch fails
          let chapterName = 'Unknown';
          try { chapterName = (await fetchChapter(surahNo)).name_simple; } catch {/* ignore */}
          return {
            id: surahNo * 1000 + verseNo,
            verseKey: v.key,
            surahName: chapterName,
            surahNumber: surahNo,
            verseNumber: verseNo,
            arabicText: v.arabic ?? '',
            translation: v.name?.replace(/<[^>]*>/g, '') ?? '',
            audioUrl: buildAudioUrl(surahNo, verseNo),
            theme,
          };
        }
      })
    );

    const totalPages: number = res.data?.pagination?.total_pages ?? 20;
    return { ayahs: ayahs.filter((a) => a.arabicText && a.translation), totalPages };
  } catch (err: any) {
    console.warn('[quranApi] searchAyahs error:',
      err?.response?.status,
      JSON.stringify(err?.response?.data),
      err?.message);
    return { ayahs: [], totalPages: 20 };
  }
}

export async function fetchVersesByChapter(
  chapterId: number,
  limit = 10,
  translationId: number = DEFAULT_TRANSLATION_ID
): Promise<Ayah[]> {
  try {
    const [res, chapter] = await Promise.all([
      api.get(`verses/by_chapter/${chapterId}`, {
        params: {
          language: 'en',
          words: false,
          translations: translationId,
          per_page: limit,
          page: 1,
        },
      }),
      fetchChapter(chapterId),
    ]);

    const verses: Verse[] = res.data?.verses ?? [];
    return verses.map((v) => toAyah(v, chapter.name_simple));
  } catch (err) {
    console.warn('[quranApi] fetchVersesByChapter error:', err);
    return [];
  }
}

export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const res = await api.get('chapters', { params: { language: 'en' } });
    return res.data?.chapters ?? [];
  } catch {
    return [];
  }
}

// ─── Tafsir ───────────────────────────────────────────────────────────────────

/**
 * Best tafsir resource ID per selected language (display name from LanguageOption).
 * Only languages with a native tafsir on quran.com are listed.
 * All others fall back to Ibn Kathir (Abridged) English — ID 169.
 */
const TAFSIR_BY_LANGUAGE: Record<string, { id: number; name: string }> = {
  English:   { id: 169, name: "Ibn Kathir (Abridged)" },
  Arabic:    { id: 16,  name: "Tafsir Muyassar" },
  Urdu:      { id: 160, name: "Tafsir Ibn Kathir (Urdu)" },
  Bengali:   { id: 381, name: "Tafsir Fathul Majid" },
  Russian:   { id: 170, name: "Al-Sa'di" },
  Kurdish:   { id: 804, name: "Rebar Kurdish Tafsir" },
};

export function getTafsirForLanguage(language: string): { id: number; name: string; isNative: boolean } {
  const entry = TAFSIR_BY_LANGUAGE[language];
  if (entry) return { ...entry, isNative: true };
  return { id: 169, name: "Ibn Kathir (Abridged)", isNative: false };
}

export const TAFSIR_IBN_KATHIR_ID = 169;

export interface TafsirResult {
  resourceName: string;
  text: string; // HTML string — strip tags before display
  isNative: boolean; // false = fell back to English
  selectedLanguage: string;
}

export async function fetchTafsir(
  verseKey: string,
  language = 'English',
): Promise<TafsirResult | null> {
  const { id: resourceId, name: tafsirName, isNative } = getTafsirForLanguage(language);
  try {
    const clientId = Constants.expoConfig?.extra?.quranClientId as string;
    const token    = await getContentToken();

    const res = await axios.get(
      `${QF_CONTENT_URL}/tafsirs/${resourceId}/by_ayah/${verseKey}`,
      {
        headers: {
          'x-auth-token': token,
          'x-client-id': clientId,
          Accept: 'application/json',
        },
        timeout: 15_000,
      }
    );

    const tafsir = res.data?.tafsir;
    if (!tafsir?.text) return null;

    return {
      resourceName: tafsirName,
      text: tafsir.text,
      isNative,
      selectedLanguage: language,
    };
  } catch (err: any) {
    console.warn('[quranApi] fetchTafsir error:',
      err?.response?.status,
      JSON.stringify(err?.response?.data),
      err?.message);
    return null;
  }
}

// ─── Word-by-word translation ─────────────────────────────────────────────────

const WBW_AUDIO_BASE = 'https://audio.qurancdn.com/';

export interface WordData {
  position: number;
  arabic: string;
  transliteration: string;
  translation: string;
  audioUrl: string | null;
}

export async function fetchWordByWord(verseKey: string): Promise<WordData[]> {
  try {
    const res = await axios.get(`${BASE}verses/by_key/${verseKey}`, {
      params: {
        words: true,
        word_fields: 'text_uthmani,translation,transliteration,audio_url',
      },
      headers: { Accept: 'application/json' },
      timeout: 10_000,
    });
    const words: any[] = res.data?.verse?.words ?? [];
    return words
      .filter((w: any) => w.char_type_name !== 'end')   // skip verse-end symbols
      .map((w: any, i: number) => ({
        position: i + 1,
        arabic: w.text_uthmani ?? '',
        transliteration: w.transliteration?.text ?? '',
        translation: w.translation?.text ?? '',
        audioUrl: w.audio_url ? `${WBW_AUDIO_BASE}${w.audio_url}` : null,
      }));
  } catch (err: any) {
    console.warn('[quranApi] fetchWordByWord error:', err?.response?.status, err?.message);
    return [];
  }
}

// ─── Fallback curated ayahs (offline / API failure) ──────────────────────────

export const FALLBACK_AYAHS: Record<string, Ayah[]> = {
  Stressed: [
    {
      id: 2153,
      verseKey: '2:153',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      verseNumber: 153,
      arabicText: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
      translation: 'O you who believe! Seek help through patience and prayer. Surely Allah is with those who are patient.',
      audioUrl: buildAudioUrl(2, 153),
      theme: 'Patience & Trust',
      explanation: 'This ayah reminds us that patience and prayer are our greatest tools when life becomes overwhelming. Allah promises His company to those who are patient.',
    },
    {
      id: 3139,
      verseKey: '3:139',
      surahName: 'Al-Imran',
      surahNumber: 3,
      verseNumber: 139,
      arabicText: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ إِن كُنتُم مُّؤْمِنِينَ',
      translation: 'Do not be faint-hearted or grieve; you will be the dominant ones if you are [true] believers.',
      audioUrl: buildAudioUrl(3, 139),
      theme: 'Patience & Trust',
      explanation: 'This ayah encourages believers not to lose hope. Faith gives us inner strength that transcends worldly pressure.',
    },
    {
      id: 9451,
      verseKey: '94:5',
      surahName: 'Ash-Sharh',
      surahNumber: 94,
      verseNumber: 5,
      arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      translation: 'So, surely with hardship comes ease.',
      audioUrl: buildAudioUrl(94, 5),
      theme: 'Hope & Ease',
      explanation: 'A promise directly from Allah — hardship is always paired with relief. This is one of the most comforting assurances in the Quran.',
    },
  ],
  Sad: [
    {
      id: 9303,
      verseKey: '93:3',
      surahName: 'Ad-Duha',
      surahNumber: 93,
      verseNumber: 3,
      arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      translation: 'Your Lord has not abandoned you, nor has He become hostile to you.',
      audioUrl: buildAudioUrl(93, 3),
      theme: 'Divine Comfort',
      explanation: 'Allah reassures us that He never abandons those He loves. Sadness is temporary; Allah\'s care is eternal.',
    },
    {
      id: 1287,
      verseKey: '12:87',
      surahName: 'Yusuf',
      surahNumber: 12,
      verseNumber: 87,
      arabicText: 'وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ ۖ إِنَّهُ لَا يَيْأَسُ مِن رَّوْحِ اللَّهِ إِلَّا الْقَوْمُ الْكَافِرُونَ',
      translation: 'And do not despair of Allah\'s mercy. Only the faithless despair of Allah\'s mercy.',
      audioUrl: buildAudioUrl(12, 87),
      theme: 'Hope & Mercy',
      explanation: 'No matter how deep the sadness, Allah\'s mercy is always greater. Despair is not an option for a believer.',
    },
    {
      id: 1328,
      verseKey: '13:28',
      surahName: 'Ar-Ra\'d',
      surahNumber: 13,
      verseNumber: 28,
      arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      translation: 'Verily, in the remembrance of Allah do hearts find rest.',
      audioUrl: buildAudioUrl(13, 28),
      theme: 'Peace of Heart',
      explanation: 'The cure for a sad heart is the remembrance of Allah. This simple yet profound truth is the foundation of Islamic spirituality.',
    },
  ],
  Angry: [
    {
      id: 3134,
      verseKey: '3:134',
      surahName: 'Al-Imran',
      surahNumber: 3,
      verseNumber: 134,
      arabicText: 'الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
      translation: 'Those who donate in prosperity and adversity, control their anger, and pardon others. And Allah loves the good-doers.',
      audioUrl: buildAudioUrl(3, 134),
      theme: 'Self-Control & Pardon',
      explanation: 'Controlling anger and forgiving others are qualities of the righteous. Allah specifically loves those who master these traits.',
    },
    {
      id: 4134,
      verseKey: '41:34',
      surahName: 'Fussilat',
      surahNumber: 41,
      verseNumber: 34,
      arabicText: 'وَلَا تَسْتَوِي الْحَسَنَةُ وَلَا السَّيِّئَةُ ۚ ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ',
      translation: 'Good and evil are not equal. Respond to evil with what is best.',
      audioUrl: buildAudioUrl(41, 34),
      theme: 'Wisdom in Response',
      explanation: 'Islam teaches us to respond to negativity with goodness. This transforms enemies into allies and anger into grace.',
    },
  ],
  Confused: [
    {
      id: 2286,
      verseKey: '2:186',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      verseNumber: 186,
      arabicText: 'وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
      translation: 'When My servants ask you about Me: I am truly near. I respond to the call of the supplicant when they call upon Me.',
      audioUrl: buildAudioUrl(2, 186),
      theme: 'Divine Guidance',
      explanation: 'When you feel lost or confused, Allah is closer than you think. He hears every prayer and answers in the best way.',
    },
    {
      id: 6503,
      verseKey: '65:3',
      surahName: 'At-Talaq',
      surahNumber: 65,
      verseNumber: 3,
      arabicText: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
      translation: 'And whoever relies upon Allah – then He is sufficient for him. Indeed, Allah will accomplish His purpose.',
      audioUrl: buildAudioUrl(65, 3),
      theme: 'Trust in Allah',
      explanation: 'In times of confusion, entrust your affairs to Allah. He is all-knowing and will guide you to what is best.',
    },
  ],
  'Need Motivation': [
    {
      id: 9451,
      verseKey: '94:5',
      surahName: 'Ash-Sharh',
      surahNumber: 94,
      verseNumber: 5,
      arabicText: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
      translation: 'So, surely with hardship comes ease.',
      audioUrl: buildAudioUrl(94, 5),
      theme: 'Hope & Strength',
      explanation: 'This is Allah\'s unchanging promise. Every difficulty is accompanied by ease. Let this fuel your motivation.',
    },
    {
      id: 22860,
      verseKey: '2:286',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      verseNumber: 286,
      arabicText: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
      translation: 'Allah does not burden any soul beyond what it can bear.',
      audioUrl: buildAudioUrl(2, 286),
      theme: 'Inner Strength',
      explanation: 'Allah only gives you what you can handle. You are stronger than you think — Allah knows your capacity.',
    },
    {
      id: 39530,
      verseKey: '39:53',
      surahName: 'Az-Zumar',
      surahNumber: 39,
      verseNumber: 53,
      arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ',
      translation: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah.',
      audioUrl: buildAudioUrl(39, 53),
      theme: 'Mercy & Renewal',
      explanation: 'No matter how far you feel, Allah\'s door is always open. This verse is an invitation to restart and renew your journey.',
    },
  ],
  Grateful: [
    {
      id: 14007,
      verseKey: '14:7',
      surahName: 'Ibrahim',
      surahNumber: 14,
      verseNumber: 7,
      arabicText: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
      translation: 'If you are grateful, I will surely increase you [in favour].',
      audioUrl: buildAudioUrl(14, 7),
      theme: 'Gratitude & Praise',
      explanation: 'A direct promise from Allah: gratitude unlocks more blessings. This verse is the foundation of an abundant life.',
    },
    {
      id: 55013,
      verseKey: '55:13',
      surahName: 'Ar-Rahman',
      surahNumber: 55,
      verseNumber: 13,
      arabicText: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
      translation: 'So which of the favours of your Lord will you deny?',
      audioUrl: buildAudioUrl(55, 13),
      theme: 'Gratitude & Praise',
      explanation: 'A gentle, recurring reminder from Allah to notice His countless gifts. Every breath, every heartbeat is a blessing worth acknowledging.',
    },
    {
      id: 31012,
      verseKey: '31:12',
      surahName: 'Luqman',
      surahNumber: 31,
      verseNumber: 12,
      arabicText: 'وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ',
      translation: 'Whoever is grateful, is only grateful for the benefit of himself.',
      audioUrl: buildAudioUrl(31, 12),
      theme: 'Gratitude & Praise',
      explanation: 'Gratitude is ultimately a gift you give yourself. It shifts your heart from scarcity to abundance and draws you closer to Allah.',
    },
  ],
  Lonely: [
    {
      id: 9303,
      verseKey: '93:3',
      surahName: 'Ad-Duha',
      surahNumber: 93,
      verseNumber: 3,
      arabicText: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
      translation: 'Your Lord has not abandoned you, nor has He become hostile to you.',
      audioUrl: buildAudioUrl(93, 3),
      theme: 'Divine Companionship',
      explanation: 'When loneliness creeps in, this verse is Allah\'s direct reply: He has not left you. His love for you is unchanged.',
    },
    {
      id: 2186,
      verseKey: '2:186',
      surahName: 'Al-Baqarah',
      surahNumber: 2,
      verseNumber: 186,
      arabicText: 'فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ',
      translation: 'I am truly near. I respond to the call of the supplicant when they call upon Me.',
      audioUrl: buildAudioUrl(2, 186),
      theme: 'Divine Companionship',
      explanation: 'You are never more than a sincere prayer away from Allah. He is closer to you than your own jugular vein.',
    },
    {
      id: 50016,
      verseKey: '50:16',
      surahName: 'Qaf',
      surahNumber: 50,
      verseNumber: 16,
      arabicText: 'وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
      translation: 'We are closer to him than his jugular vein.',
      audioUrl: buildAudioUrl(50, 16),
      theme: 'Divine Companionship',
      explanation: 'Allah knows you more intimately than you know yourself. Loneliness dissolves in the light of this profound nearness.',
    },
  ],
  Fearful: [
    {
      id: 39053,
      verseKey: '39:53',
      surahName: 'Az-Zumar',
      surahNumber: 39,
      verseNumber: 53,
      arabicText: 'لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
      translation: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
      audioUrl: buildAudioUrl(39, 53),
      theme: 'Hope in Fear',
      explanation: 'Fear is overcome by hope in Allah\'s mercy. No matter what you fear, His forgiveness and care are greater.',
    },
    {
      id: 3173,
      verseKey: '3:173',
      surahName: 'Al-Imran',
      surahNumber: 3,
      verseNumber: 173,
      arabicText: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
      translation: 'Allah is sufficient for us, and He is the best Disposer of affairs.',
      audioUrl: buildAudioUrl(3, 173),
      theme: 'Hope in Fear',
      explanation: 'When fear grips you, this short but powerful verse is your shield. Allah handles what you cannot; entrust your worries to Him.',
    },
    {
      id: 9006,
      verseKey: '9:51',
      surahName: 'At-Tawbah',
      surahNumber: 9,
      verseNumber: 51,
      arabicText: 'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا',
      translation: 'Say: Nothing will befall us except what Allah has decreed for us.',
      audioUrl: buildAudioUrl(9, 51),
      theme: 'Hope in Fear',
      explanation: 'Every outcome is already written by Allah. Fear loses its power when you truly believe that only what He wills can reach you.',
    },
  ],
  'Seeking Forgiveness': [
    {
      id: 39053,
      verseKey: '39:53',
      surahName: 'Az-Zumar',
      surahNumber: 39,
      verseNumber: 53,
      arabicText: 'قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
      translation: 'Say: O My servants who have transgressed against themselves, do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
      audioUrl: buildAudioUrl(39, 53),
      theme: 'Repentance & Mercy',
      explanation: 'This is perhaps the most hopeful verse for the one seeking forgiveness. Allah forgives all sins — no exception, no condition except sincere return.',
    },
    {
      id: 3135,
      verseKey: '3:135',
      surahName: 'Al-Imran',
      surahNumber: 3,
      verseNumber: 135,
      arabicText: 'وَالَّذِينَ إِذَا فَعَلُوا فَاحِشَةً أَوْ ظَلَمُوا أَنفُسَهُمْ ذَكَرُوا اللَّهَ فَاسْتَغْفَرُوا لِذُنُوبِهِمْ',
      translation: 'Those who, when they commit an immorality or wrong themselves, remember Allah and seek forgiveness for their sins.',
      audioUrl: buildAudioUrl(3, 135),
      theme: 'Repentance & Mercy',
      explanation: 'The defining quality of a believer is not perfection, but returning to Allah after every fall. Seeking forgiveness is itself an act of worship.',
    },
    {
      id: 4110,
      verseKey: '4:110',
      surahName: 'An-Nisa',
      surahNumber: 4,
      verseNumber: 110,
      arabicText: 'وَمَن يَعْمَلْ سُوءًا أَوْ يَظْلِمْ نَفْسَهُ ثُمَّ يَسْتَغْفِرِ اللَّهَ يَجِدِ اللَّهَ غَفُورًا رَّحِيمًا',
      translation: 'Whoever does evil or wrongs himself, then seeks Allah\'s forgiveness, will find Allah Most Forgiving, Most Merciful.',
      audioUrl: buildAudioUrl(4, 110),
      theme: 'Repentance & Mercy',
      explanation: 'The door of forgiveness is always open. All that is required is that you knock — Allah opens it with mercy every time.',
    },
  ],
  'Seeking Peace': [
    {
      id: 13028,
      verseKey: '13:28',
      surahName: 'Ar-Ra\'d',
      surahNumber: 13,
      verseNumber: 28,
      arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
      translation: 'Verily, in the remembrance of Allah do hearts find rest.',
      audioUrl: buildAudioUrl(13, 28),
      theme: 'Inner Peace',
      explanation: 'Peace is not found in the world — it is found in Allah\'s remembrance. Let this verse anchor your heart.',
    },
    {
      id: 89027,
      verseKey: '89:27',
      surahName: 'Al-Fajr',
      surahNumber: 89,
      verseNumber: 27,
      arabicText: 'يَا أَيَّتُهَا النَّفْسُ الْمُطْمَئِنَّةُ',
      translation: 'O tranquil soul,',
      audioUrl: buildAudioUrl(89, 27),
      theme: 'Inner Peace',
      explanation: 'This is Allah\'s address to the peaceful soul — the one that has found its rest in Him. Your seeking is the path to this blessed state.',
    },
    {
      id: 48004,
      verseKey: '48:4',
      surahName: 'Al-Fath',
      surahNumber: 48,
      verseNumber: 4,
      arabicText: 'هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ',
      translation: 'He is the One Who sent down serenity into the hearts of the believers.',
      audioUrl: buildAudioUrl(48, 4),
      theme: 'Inner Peace',
      explanation: 'Serenity is a divine gift, sent directly into the believer\'s heart by Allah. Ask for it and open your heart to receive it.',
    },
  ],
};
