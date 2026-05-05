import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../types';
import { useAppStore } from '../store/useAppStore';

const { width: W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// ─── Slide illustrations ───────────────────────────────────────────────────────

function MoodIllustration() {
  const moods = [
    { emoji: '😢', bg: '#DBEAFE' },
    { emoji: '😐', bg: '#FEF9C3' },
    { emoji: '😊', bg: '#DCFCE7' },
    { emoji: '🤍', bg: '#FCE7F3' },
  ];
  return (
    <View style={illus.root}>
      <View style={[illus.bgCircle, { backgroundColor: '#E8F5E9' }]} />
      <View style={illus.moodRow}>
        {moods.map((m, i) => (
          <View key={i} style={[illus.moodBubble, { backgroundColor: m.bg }]}>
            <Text style={illus.moodEmoji}>{m.emoji}</Text>
          </View>
        ))}
      </View>
      <View style={illus.ayahCard}>
        <Text style={illus.ayahArabic}>ألا بِذِكرِ اللهِ تَطمَئِنُّ القُلوبُ</Text>
        <Text style={illus.ayahTranslation}>
          Verily, in the remembrance of{'\n'}Allah do hearts find rest.
        </Text>
        <View style={illus.ayahFooter}>
          <Text style={illus.ayahRef}>(Ar-Ra'd 13:28)</Text>
          <Ionicons name="heart" size={14} color="#2E7D32" />
        </View>
      </View>
    </View>
  );
}

function LanguageIllustration() {
  const chips = ['English', 'Tamil', 'Urdu', 'Français', 'العربية'];
  return (
    <View style={illus.root}>
      <View style={[illus.bgCircle, { backgroundColor: '#E0F2FE' }]} />
      {/* Language selector pill */}
      <View style={illus.langPill}>
        <Ionicons name="language-outline" size={15} color="#0369A1" />
        <Text style={illus.langPillText}>Translation Language</Text>
        <Ionicons name="chevron-down" size={13} color="#0369A1" />
      </View>
      {/* Language chips row */}
      <View style={illus.langChipsRow}>
        {chips.map((l, i) => (
          <View key={i} style={[illus.langChip, i === 0 && illus.langChipActive]}>
            <Text style={[illus.langChipText, i === 0 && illus.langChipTextActive]}>{l}</Text>
          </View>
        ))}
      </View>
      {/* Ayah card */}
      <View style={illus.ayahCard}>
        <Text style={illus.ayahArabic}>وَنَحنُ أَقرَبُ إِلَيهِ مِن حَبلِ الوَريدِ</Text>
        <Text style={illus.ayahTranslation}>
          We are closer to him than{"\n"}his jugular vein.
        </Text>
        <View style={illus.ayahFooter}>
          <Text style={illus.ayahRef}>(Qāf 50:16)</Text>
          <Ionicons name="heart" size={14} color="#2E7D32" />
        </View>
      </View>
    </View>
  );
}

function WordByWordIllustration() {
  const words = [
    { arabic: 'بِسْمِ', translit: 'bismi', meaning: 'In the name' },
    { arabic: 'ٱللَّهِ', translit: 'allāhi', meaning: 'of Allah' },
    { arabic: 'ٱلرَّحْمَـٰنِ', translit: 'al-raḥmāni', meaning: 'the Most Gracious' },
    { arabic: 'ٱلرَّحِيمِ', translit: 'al-raḥīmi', meaning: 'the Most Merciful' },
  ];
  const activeIdx = 1; // highlight "allāhi"
  return (
    <View style={illus.root}>
      <View style={[illus.bgCircle, { backgroundColor: '#F0FDF4' }]} />

      {/* Header label */}
      <View style={illus.wbwHeader}>
        <View style={illus.wbwIconBox}>
          <Ionicons name="language-outline" size={14} color="#2E7D32" />
        </View>
        <Text style={illus.wbwHeaderText}>Word by Word</Text>
        <Text style={illus.wbwHeaderSub}>  ·  Tap to pronounce</Text>
      </View>

      {/* Word chips — RTL order */}
      <View style={illus.wbwChipsRow}>
        {[...words].reverse().map((w, i) => {
          const realIdx = words.length - 1 - i;
          const active = realIdx === activeIdx;
          return (
            <View key={i} style={[illus.wbwChip, active && illus.wbwChipActive]}>
              <View style={[illus.wbwChipBadge, active && illus.wbwChipBadgeActive]}>
                <Text style={illus.wbwChipBadgeText}>{realIdx + 1}</Text>
              </View>
              <Text style={[illus.wbwChipArabic, active && illus.wbwChipArabicActive]}>{w.arabic}</Text>
              <View style={illus.wbwChipDivider} />
              <Text style={[illus.wbwChipTranslit, active && illus.wbwChipTranslitActive]}>{w.translit}</Text>
              <Text style={illus.wbwChipMeaning}>{w.meaning}</Text>
              {active && (
                <View style={illus.wbwSpeakerDot}>
                  <Ionicons name="volume-high" size={9} color="#fff" />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Ayah reference pill */}
      <View style={illus.wbwRefPill}>
        <Ionicons name="musical-notes-outline" size={12} color="#2E7D32" />
        <Text style={illus.wbwRefText}>Al-Fatihah · 1:1 · English only</Text>
      </View>
    </View>
  );
}

function ReflectionIllustration() {
  return (
    <View style={illus.root}>
      <View style={[illus.bgCircle, { backgroundColor: '#EDE9FE' }]} />
      <View style={illus.reflectionCard}>
        <View style={illus.reflectionHeader}>
          <Ionicons name="heart" size={14} color="#2E7D32" />
          <Text style={illus.reflectionTitle}>My Reflections</Text>
        </View>
        <Text style={illus.reflectionBody}>
          This ayah reminds me to{'\n'}trust Allah in every situation.
        </Text>
        <Text style={illus.reflectionDate}>Today, 8:30 AM</Text>
      </View>
      <View style={illus.statsRow}>
        <View style={[illus.statCard, { backgroundColor: '#EDE9FE' }]}>
          <Ionicons name="bookmark" size={18} color="#7C3AED" />
          <Text style={illus.statLabel}>Bookmarks</Text>
          <Text style={illus.statValue}>12 saved ayahs</Text>
        </View>
        <View style={[illus.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Ionicons name="albums" size={18} color="#2563EB" />
          <Text style={illus.statLabel}>Collections</Text>
          <Text style={illus.statValue}>4 playlists</Text>
        </View>
      </View>
    </View>
  );
}

function StreakIllustration() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={illus.root}>
      <View style={[illus.bgCircle, { backgroundColor: '#DCFCE7' }]} />
      {/* Mosque night circle */}
      <View style={illus.mosqueCircle}>
        <Text style={{ fontSize: 10, color: '#FFFFFF', opacity: 0.9 }}>🕌</Text>
        <Text style={illus.mosqueEmoji}>🌙</Text>
      </View>
      {/* Streak calendar card */}
      <View style={illus.streakCard}>
        <Text style={illus.streakLabel}>Streak</Text>
        <View style={illus.streakCountRow}>
          <Text style={{ fontSize: 26 }}>🔥</Text>
          <Text style={illus.streakNumber}>12</Text>
        </View>
        <Text style={illus.streakDaysLabel}>days</Text>
        <View style={illus.weekRow}>
          {days.map((d, i) => (
            <View key={i} style={illus.dayCol}>
              <Text style={illus.dayChar}>{d}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            </View>
          ))}
        </View>
      </View>
      {/* Notification bubble */}
      <View style={illus.notifCard}>
        <View style={illus.notifIconBox}>
          <Ionicons name="book-outline" size={14} color="#2E7D32" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={illus.notifTitle}>Time for a moment{'\n'}with the Quran</Text>
          <Text style={illus.notifBody}>Take a few minutes to strengthen your connection.</Text>
        </View>
        <Text style={illus.notifNow}>now</Text>
      </View>
    </View>
  );
}

// ─── Slide data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    key: 'mood',
    Illustration: MoodIllustration,
    title: 'Find the right ayah\nfor your moment',
    subtitle:
      'Share how you feel and let app recommend ayahs that bring you peace and guidance.',
    features: [
      {
        icon: 'happy-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Select your mood',
        desc: 'Tell us how you feel.',
      },
      {
        icon: 'star-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Smart recommendations',
        desc: 'Get ayahs that speak to your heart.',
      },
      {
        icon: 'book-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Instant guidance',
        desc: 'Understand and reflect instantly.',
      },
    ],
  },
  {
    key: 'language',
    Illustration: LanguageIllustration,
    title: 'Read in your\nlanguage',
    subtitle:
      'Choose from 50+ languages to read translations that feel natural to you.',
    features: [
      {
        icon: 'language-outline' as const,
        color: '#0369A1',
        bg: '#E0F2FE',
        label: '50+ languages',
        desc: 'English, Tamil, Urdu, Arabic, French and more.',
      },
      {
        icon: 'swap-horizontal-outline' as const,
        color: '#0369A1',
        bg: '#E0F2FE',
        label: 'Switch anytime',
        desc: 'Change your translation language from any screen.',
      },
      {
        icon: 'reader-outline' as const,
        color: '#0369A1',
        bg: '#E0F2FE',
        label: 'Tafsir in your language',
        desc: 'Deep explanations available in select languages.',
      },
    ],
  },
  {
    key: 'wordbyword',
    Illustration: WordByWordIllustration,
    title: 'Understand every\nword of the Quran',
    subtitle:
      'Tap any Arabic word to hear its pronunciation and see its meaning instantly.',
    features: [
      {
        icon: 'text-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Word by word breakdown',
        desc: 'Each word shown with Arabic, transliteration and meaning.',
      },
      {
        icon: 'volume-high-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Tap to pronounce',
        desc: 'Hear the correct pronunciation of each Arabic word.',
      },
      {
        icon: 'swap-horizontal-outline' as const,
        color: '#2E7D32',
        bg: '#E8F5E9',
        label: 'Follows Ayah order',
        desc: 'Words flow right-to-left, matching the Quran.',
      },
    ],
  },
  {
    key: 'reflect',
    Illustration: ReflectionIllustration,
    title: 'Reflect and make\nit personal',
    subtitle: 'Save, organize and reflect on ayahs that matter to you.',
    features: [
      {
        icon: 'create-outline' as const,
        color: '#7C3AED',
        bg: '#EDE9FE',
        label: 'Write reflections',
        desc: 'Journal your thoughts and learnings.',
      },
      {
        icon: 'bookmark-outline' as const,
        color: '#D97706',
        bg: '#FEF3C7',
        label: 'Bookmark ayahs',
        desc: 'Save your favorite ayahs for later.',
      },
      {
        icon: 'folder-outline' as const,
        color: '#2563EB',
        bg: '#DBEAFE',
        label: 'Create collections',
        desc: 'Organize ayahs by mood or theme.',
      },
    ],
  },
  {
    key: 'streak',
    Illustration: StreakIllustration,
    title: 'Stay consistent,\ngrow daily',
    subtitle:
      'Build a lasting connection with small daily steps and consistent habits.',
    features: [
      {
        icon: 'flame-outline' as const,
        color: '#EA580C',
        bg: '#FFEDD5',
        label: 'Track your streak',
        desc: 'Build consistency, one day at a time.',
      },
      {
        icon: 'notifications-outline' as const,
        color: '#16A34A',
        bg: '#DCFCE7',
        label: 'Gentle reminders',
        desc: 'Stay on track with thoughtful nudges.',
      },
      {
        icon: 'bar-chart-outline' as const,
        color: '#2563EB',
        bg: '#DBEAFE',
        label: 'See your progress',
        desc: 'Celebrate your journey and growth.',
      },
    ],
  },
];

// ─── Screen ────────────────────────────────────────────────────────────────────

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const setHasSeenOnboarding = useAppStore((s) => s.setHasSeenOnboarding);
  const insets = useSafeAreaInsets();

  const isLast = activeIndex === SLIDES.length - 1;

  const goNext = () => {
    const next = activeIndex + 1;
    scrollRef.current?.scrollTo({ x: W * next, animated: true });
    setActiveIndex(next);
  };

  const handleMomentumEnd = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / W);
    setActiveIndex(index);
  };

  const finish = () => {
    setHasSeenOnboarding(true);
    navigation.replace('Home');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Paged slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        style={{ flex: 1 }}
        bounces={false}
      >
        {SLIDES.map((slide) => {
          const Illus = slide.Illustration;
          return (
            <View key={slide.key} style={styles.slide}>
              {/* Illustration */}
              <View style={styles.illustrationArea}>
                <Illus />
              </View>

              {/* Text + feature list */}
              <View style={styles.content}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
                <View style={styles.featureList}>
                  {slide.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <View style={[styles.featureIconBox, { backgroundColor: f.bg }]}>
                        <Ionicons name={f.icon as any} size={20} color={f.color} />
                      </View>
                      <View style={styles.featureTextWrap}>
                        <Text style={styles.featureLabel}>{f.label}</Text>
                        <Text style={styles.featureDesc}>{f.desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity style={styles.startBtn} onPress={finish} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>Start Your Journey</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.arrowBtn} onPress={goNext} activeOpacity={0.85}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Illustration styles ───────────────────────────────────────────────────────

const illus = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bgCircle: {
    position: 'absolute',
    width: W * 0.72,
    height: W * 0.72,
    borderRadius: (W * 0.72) / 2,
    top: '5%',
  },

  // ── Slide 1 ──
  moodRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 10,
  },
  moodBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: { fontSize: 22 },
  ayahCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: W * 0.62,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  ayahArabic: {
    fontFamily: Platform.OS === 'ios' ? 'System' : 'serif',
    fontSize: 18,
    color: '#1B5E20',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
    writingDirection: 'rtl',
  },
  ayahTranslation: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 8,
  },
  ayahFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ayahRef: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  // ── Language slide ──
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  langPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369A1',
  },
  langChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: W * 0.04,
  },
  langChip: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  langChipActive: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  langChipTextActive: {
    color: '#FFFFFF',
  },

  // ── Word by Word slide ──
  wbwHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  wbwIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wbwHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  wbwHeaderSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  wbwChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: W * 0.02,
  },
  wbwChip: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 3,
    borderTopColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  wbwChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderTopColor: '#1B5E20',
    elevation: 3,
  },
  wbwChipBadge: {
    position: 'absolute',
    top: -1,
    right: 5,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  wbwChipBadgeActive: {
    backgroundColor: '#1B5E20',
  },
  wbwChipBadgeText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
  },
  wbwChipArabic: {
    fontSize: 17,
    color: '#1B1B1B',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 4,
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  wbwChipArabicActive: {
    color: '#2E7D32',
  },
  wbwChipDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 4,
  },
  wbwChipTranslit: {
    fontSize: 9,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 2,
    textAlign: 'center',
  },
  wbwChipTranslitActive: {
    color: '#2E7D32',
  },
  wbwChipMeaning: {
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 70,
  },
  wbwSpeakerDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wbwRefPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  wbwRefText: {
    fontSize: 10,
    color: '#2E7D32',
    fontWeight: '600',
  },

  // ── Slide 2 ──
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: W * 0.58,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  reflectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  reflectionBody: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 17,
    marginBottom: 6,
  },
  reflectionDate: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    minWidth: W * 0.26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginTop: 5,
  },
  statValue: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  // ── Slide 3 ──
  mosqueCircle: {
    position: 'absolute',
    right: W * 0.05,
    top: '8%',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1B3A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mosqueEmoji: { fontSize: 26 },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: W * 0.52,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  streakLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  streakCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 44,
  },
  streakDaysLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dayCol: {
    alignItems: 'center',
    gap: 2,
  },
  dayChar: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '600',
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: W * 0.62,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notifIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 16,
  },
  notifBody: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 14,
  },
  notifNow: {
    fontSize: 9,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});

// ─── Screen styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },
  skipBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 24,
    zIndex: 10,
  },
  skipText: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: '600',
  },
  slide: {
    width: W,
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 64 : 50,
  },
  illustrationArea: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 22,
  },
  featureList: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },

  // ── Bottom ──
  bottomBar: {
    paddingHorizontal: 28,
    paddingTop: 12,
    backgroundColor: '#F5F7F2',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#2E7D32',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#D1D5DB',
  },

  // Arrow for slides 1 & 2
  arrowBtn: {
    alignSelf: 'flex-end',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },

  // Last slide button
  startBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

