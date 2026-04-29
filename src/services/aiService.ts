import type { Mood, MoodOption, Ayah } from '../types';
import { searchAyahs, fetchVersesByChapter, FALLBACK_AYAHS } from './quranApi';

// ─── Mood definitions ────────────────────────────────────────────────────────

export const MOOD_OPTIONS: MoodOption[] = [
  {
    label: 'Stressed',
    emoji: '😔',
    color: '#92400E',
    bgColor: '#FEF3C7',
    keywords: ['patience hardship', 'ease burden', 'trust relief', 'anxiety Allah'],
    theme: 'Patience & Trust',
  },
  {
    label: 'Sad',
    emoji: '😢',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    keywords: ['mercy comfort', 'hope hearts', 'Allah near', 'grief sadness'],
    theme: 'Divine Comfort',
  },
  {
    label: 'Angry',
    emoji: '😡',
    color: '#991B1B',
    bgColor: '#FEE2E2',
    keywords: ['anger forgiveness', 'patience pardon', 'restrain forbearance', 'forgive enemy'],
    theme: 'Self-Control & Pardon',
  },
  {
    label: 'Confused',
    emoji: '😕',
    color: '#5B21B6',
    bgColor: '#EDE9FE',
    keywords: ['guidance light', 'wisdom truth', 'direction path', 'clarity Allah'],
    theme: 'Divine Guidance',
  },
  {
    label: 'Need Motivation',
    emoji: '🌱',
    color: '#065F46',
    bgColor: '#D1FAE5',
    keywords: ['strength hope', 'perseverance renewal', 'mercy Allah', 'purpose faith'],
    theme: 'Hope & Strength',
  },
  {
    label: 'Grateful',
    emoji: '🤍',
    color: '#92400E',
    bgColor: '#FEF3C7',
    keywords: ['grateful thankful', 'blessings praise', 'bounty favour', 'thank Allah'],
    theme: 'Gratitude & Praise',
  },
  {
    label: 'Lonely',
    emoji: '🥺',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    keywords: ['lonely heart', 'Allah alone', 'nearness beloved', 'companion Allah'],
    theme: 'Divine Companionship',
  },
  {
    label: 'Fearful',
    emoji: '😨',
    color: '#4C1D95',
    bgColor: '#EDE9FE',
    keywords: ['fear death', 'judgment hereafter', 'fear Allah mercy', 'hope fear balance'],
    theme: 'Hope in Fear',
  },
  {
    label: 'Seeking Forgiveness',
    emoji: '🥲',
    color: '#065F46',
    bgColor: '#D1FAE5',
    keywords: ['repentance forgive', 'sin return', 'tawbah mercy', 'forgiveness Allah'],
    theme: 'Repentance & Mercy',
  },
  {
    label: 'Seeking Peace',
    emoji: '😌',
    color: '#0C4A6E',
    bgColor: '#E0F2FE',
    keywords: ['peace tranquil', 'serenity calm', 'tranquility heart', 'stillness trust'],
    theme: 'Inner Peace',
  },
];

// ─── Mood → surah fallback pool ───────────────────────────────────────────────

const MOOD_SURAHS: Record<string, number[]> = {
  Stressed:               [94, 93, 65, 2, 3, 39],
  Sad:                    [93, 94, 12, 55, 39, 2],
  Angry:                  [3, 41, 7, 16, 25, 49],
  Confused:               [2, 17, 18, 27, 65, 10],
  'Need Motivation':      [94, 39, 65, 2, 3, 55],
  Grateful:               [55, 14, 31, 2, 16, 34],
  Lonely:                 [93, 2, 50, 57, 58, 20],
  Fearful:                [39, 3, 2, 9, 11, 64],
  'Seeking Forgiveness':  [3, 39, 4, 66, 71, 2],
  'Seeking Peace':        [13, 89, 48, 3, 2, 59],
};

// ─── AI service: mood → relevant ayahs ───────────────────────────────────────

export async function getAyahsForMood(mood: Mood): Promise<Ayah[]> {
  const moodOption = MOOD_OPTIONS.find((m) => m.label === mood);
  if (!moodOption) return FALLBACK_AYAHS[mood] ?? [];

  // Query ALL keywords on pages 1 and 2 for a larger initial pool
  const seen = new Set<string>();
  const all: Ayah[] = [];
  for (const page of [1, 2]) {
    for (const query of moodOption.keywords) {
      try {
        const results = await searchAyahs(query, moodOption.theme, 10, page);
        for (const a of results) {
          if (!seen.has(a.verseKey)) {
            seen.add(a.verseKey);
            all.push({ ...a, theme: moodOption.theme, explanation: generateExplanation(mood, a) });
          }
        }
      } catch { /* skip failed query */ }
    }
  }

  if (all.length >= 3) return all;

  // Fallback to curated ayahs
  return FALLBACK_AYAHS[mood] ?? [];
}

// ─── Fetch more ayahs using attempt-based cycling ────────────────────────────
//
// attempt counter cycles through:
//   0..N  → interleaved keyword pagination  (keywords[i], page 2, 3, ...)
//   N+1.. → surah-based chapter fetch (reliable, offline-free)
//
// Returns { ayahs, nextAttempt, exhausted } so the store always knows where to resume.

const MAX_KEYWORD_PAGES = 15; // pages 3..17 per keyword (pages 1+2 already loaded upfront)

export async function fetchMoreAyahsForMood(
  mood: Mood,
  startAttempt: number,
  existingKeys: Set<string>,
): Promise<{ ayahs: Ayah[]; nextAttempt: number; exhausted: boolean }> {
  const moodOption = MOOD_OPTIONS.find((m) => m.label === mood);
  if (!moodOption) return { ayahs: [], nextAttempt: startAttempt, exhausted: true };

  const { keywords, theme } = moodOption;
  const surahs = MOOD_SURAHS[mood] ?? [];
  // pages 3..17 per keyword (pages 1+2 pre-loaded at initial load)
  const keywordAttempts = keywords.length * (MAX_KEYWORD_PAGES - 2);
  const totalAttempts = keywordAttempts + surahs.length;

  let attempt = startAttempt;
  while (attempt < totalAttempts) {
    let results: Ayah[] = [];

    if (attempt < keywordAttempts) {
      // Interleave keywords: attempt 0 → keywords[0] page 3, attempt 1 → keywords[1] page 3, ...
      const keywordIdx = attempt % keywords.length;
      const page = Math.floor(attempt / keywords.length) + 3; // start from page 3
      try {
        results = await searchAyahs(keywords[keywordIdx], theme, 10, page);
      } catch { /* skip */ }
    } else {
      // Surah-based fallback: fetch whole chapters relevant to the mood
      const surahAttempt = attempt - keywordAttempts;
      try {
        results = await fetchVersesByChapter(surahs[surahAttempt], 20);
      } catch { /* skip */ }
    }

    attempt++;

    // Filter to only genuinely new ayahs — keep trying if this batch is all duplicates
    const fresh = results
      .map((a) => ({ ...a, theme, explanation: generateExplanation(mood, a) }))
      .filter((a) => !existingKeys.has(a.verseKey));

    if (fresh.length > 0) {
      return { ayahs: fresh, nextAttempt: attempt, exhausted: false };
    }
  }

  return { ayahs: [], nextAttempt: attempt, exhausted: true };
}

// ─── Contextual explanation generator ───────────────────────────────────────

function generateExplanation(mood: Mood, ayah: Ayah): string {
  const explanations: Record<Mood, string[]> = {
    Stressed: [
      'This ayah reminds us that Allah is always with those who are patient. Your stress is a test, and patience is the key to peace.',
      'Allah promises ease with every hardship. This verse is a divine reassurance that your situation will improve.',
      'Faith is your anchor. When stress overwhelms you, return to this verse and remember Who controls all affairs.',
    ],
    Sad: [
      'Allah has not forgotten you. This verse is a loving reminder that He is closer to you than your own heartbeat.',
      'Sadness is temporary, but Allah\'s mercy is infinite. Let this ayah be a light in your moment of darkness.',
      'The remembrance of Allah heals the broken heart. Recite this verse and feel the tranquility it brings.',
    ],
    Angry: [
      'True strength is not in power but in self-control. This ayah honors those who master their emotions.',
      'Responding with goodness to provocation elevates your character. Allah rewards those who choose forgiveness.',
      'Before reacting in anger, pause and reflect on this verse. Patience transforms conflict into peace.',
    ],
    Confused: [
      'When you feel lost, Allah\'s guidance is always available. This verse invites you to seek clarity through prayer.',
      'Trust in Allah\'s plan even when you cannot see the path ahead. His wisdom surpasses our understanding.',
      'Confusion is an invitation to connect with Allah. He knows what you do not, and His timing is perfect.',
    ],
    'Need Motivation': [
      'You were created with exactly the strength needed for your journey. This ayah confirms Allah\'s trust in you.',
      'Every step forward, no matter how small, is blessed. This verse fuels your spirit to keep going.',
      'Allah\'s door of mercy is always open. Start fresh today with this verse as your fuel.',
    ],
    Grateful: [
      'Gratitude multiplies blessings. This ayah invites you to recognise Allah\'s gifts and thank Him sincerely.',
      'The heart that remembers Allah\'s favours is never empty. Let this verse deepen your gratitude.',
      'Gratitude is worship. When you pause to thank Allah, you draw closer to Him and open doors of abundance.',
    ],
    Lonely: [
      'Allah is always with you — even in your most silent moments. This verse is a reminder that you are never truly alone.',
      'The One who created your heart knows its ache. Turn to Him; His companionship fills every void.',
      'Loneliness is an invitation to seek the best of companions: Allah Himself. He never leaves and never sleeps.',
    ],
    Fearful: [
      'Fear balanced with hope is the believer\'s compass. This ayah reminds you that Allah\'s mercy always outweighs His wrath.',
      'Your fear of Allah is a sign of faith. Channel it into action, and trust that He rewards those who are mindful of Him.',
      'The afterlife belongs to those who fear Allah yet never lose hope in His forgiveness. This verse steadies your heart.',
    ],
    'Seeking Forgiveness': [
      'No sin is too great for Allah\'s mercy. This verse is an open door — step through it with sincere repentance.',
      'Allah loves those who return to Him. Your desire to repent is itself a blessing and a sign of His care for you.',
      'Every moment is a chance to start again. This ayah confirms that the path back to Allah is always clear.',
    ],
    'Seeking Peace': [
      'True peace begins in the heart, and this ayah shows you exactly where to find it — in the remembrance of Allah.',
      'The world\'s noise fades when the heart is anchored in faith. Let this verse be your quiet in the storm.',
      'Peace is not the absence of difficulty; it is the presence of Allah. Recite this verse and feel stillness return.',
    ],
  };

  const pool = explanations[mood];
  return pool[ayah.id % pool.length] ?? pool[0];
}
