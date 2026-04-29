import type { Mood, MoodOption, Ayah } from '../types';
import { searchAyahs, FALLBACK_AYAHS } from './quranApi';

// ─── Mood definitions ────────────────────────────────────────────────────────

export const MOOD_OPTIONS: MoodOption[] = [
  {
    label: 'Stressed',
    emoji: '😔',
    color: '#92400E',
    bgColor: '#FEF3C7',
    keywords: ['patience hardship ease Allah trust', 'anxiety stress relief'],
    theme: 'Patience & Trust',
  },
  {
    label: 'Sad',
    emoji: '😢',
    color: '#1E40AF',
    bgColor: '#DBEAFE',
    keywords: ['comfort mercy hope sadness grief', 'Allah close hearts'],
    theme: 'Divine Comfort',
  },
  {
    label: 'Angry',
    emoji: '😡',
    color: '#991B1B',
    bgColor: '#FEE2E2',
    keywords: ['anger control forgiveness patience pardon', 'restrain emotion'],
    theme: 'Self-Control & Pardon',
  },
  {
    label: 'Confused',
    emoji: '😕',
    color: '#5B21B6',
    bgColor: '#EDE9FE',
    keywords: ['guidance light truth clarity Allah', 'direction wisdom'],
    theme: 'Divine Guidance',
  },
  {
    label: 'Need Motivation',
    emoji: '🌱',
    color: '#065F46',
    bgColor: '#D1FAE5',
    keywords: ['strength perseverance purpose hope renewal', 'Allah help will'],
    theme: 'Hope & Strength',
  },
];

// ─── AI service: mood → relevant ayahs ───────────────────────────────────────

export async function getAyahsForMood(mood: Mood): Promise<Ayah[]> {
  const moodOption = MOOD_OPTIONS.find((m) => m.label === mood);
  if (!moodOption) return FALLBACK_AYAHS[mood] ?? [];

  // Try live API with each keyword set
  for (const query of moodOption.keywords) {
    const results = await searchAyahs(query, moodOption.theme, 8);
    if (results.length >= 3) {
      // Add theme to all results
      return results.map((a) => ({
        ...a,
        theme: moodOption.theme,
        explanation: generateExplanation(mood, a),
      }));
    }
  }

  // Fallback to curated ayahs
  return FALLBACK_AYAHS[mood] ?? [];
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
  };

  const pool = explanations[mood];
  return pool[ayah.id % pool.length] ?? pool[0];
}
