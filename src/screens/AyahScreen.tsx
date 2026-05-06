import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/AudioPlayer';
import { NotificationPermissionModal } from '../components/NotificationPermissionModal';
import { AddToCollectionSheet } from '../components/AddToCollectionSheet';
import { TafsirModal } from '../components/TafsirModal';
import { fetchWordByWord, type WordData } from '../services/quranApi';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ForYou'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Animated shimmer chip — mimics the shape of a real word chip while loading
function WbwSkeletonChip() {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <Animated.View style={[skeletonStyles.chip, { opacity }]}>
      {/* Position badge stub */}
      <View style={skeletonStyles.badge} />
      {/* Arabic block */}
      <View style={skeletonStyles.arabic} />
      {/* Divider */}
      <View style={skeletonStyles.divider} />
      {/* Transliteration line */}
      <View style={skeletonStyles.line} />
      {/* Meaning line — shorter */}
      <View style={[skeletonStyles.line, { width: 36 }]} />
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 12,
    minWidth: 72,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderTopWidth: 3,
    borderTopColor: '#A7F3D0',
    gap: 6,
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: 6,
    width: 16,
    height: 12,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#A7F3D0',
  },
  arabic: {
    width: 40,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#BBF7D0',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#D1FAE5',
  },
  line: {
    width: 48,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1FAE5',
  },
});

export const AyahScreen: React.FC<Props> = ({ navigation }) => {
  const { currentAyah, nextAyah, addBookmark, removeBookmark, isBookmarked, incrementAyahsRead, addTimeSpent,
    permissionScreenShown, notificationsEnabled, weekStats, permissionDeniedDate, selectedMood } =
    useAppStore();
  const [showExplanation, setShowExplanation] = useState(false);
  const [wordByWord, setWordByWord] = useState<WordData[]>([]);
  const [wbwLoading, setWbwLoading] = useState(false);
  const [playingWord, setPlayingWord] = useState<{ pos: number; url: string } | null>(null);
  const wordPlayer = useAudioPlayer(null);
  const wordStatus = useAudioPlayerStatus(wordPlayer);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCollectionSheet, setShowCollectionSheet] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scrollRef = useRef<ScrollView>(null);
  const sessionStartRef = useRef<number>(Date.now());

  const bookmarked = currentAyah ? isBookmarked(currentAyah.verseKey) : false;

  // Track time spent: flush elapsed minutes when screen unmounts or goes to background
  useEffect(() => {
    sessionStartRef.current = Date.now();
    const interval = setInterval(() => {
      addTimeSpent(1); // add 1 minute every 60s
    }, 60_000);
    return () => {
      clearInterval(interval);
      // Flush any partial minute (≥30s counts as 1 min)
      const elapsed = Math.round((Date.now() - sessionStartRef.current) / 60_000);
      if (elapsed > 0) addTimeSpent(elapsed);
    };
  }, []);

  // Animate in when ayah changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
    if (currentAyah) incrementAyahsRead();
  }, [currentAyah?.verseKey]);

  // Fetch word-by-word when ayah changes (reset collapsed state)
  useEffect(() => {
    if (!currentAyah) return;
    setShowExplanation(false);
    setWordByWord([]);
    setWbwLoading(false);
    setPlayingWord(null);
    wordPlayer.pause();
  }, [currentAyah?.verseKey]);

  // Auto-reset highlight when word audio finishes
  useEffect(() => {
    if (wordStatus.didJustFinish) setPlayingWord(null);
  }, [wordStatus.didJustFinish]);

  // Drive audio from state — URL is stored directly in state, no stale-closure lookup
  useEffect(() => {
    if (!playingWord) {
      wordPlayer.pause();
      return;
    }
    wordPlayer.replace({ uri: playingWord.url });
    wordPlayer.play();
  }, [playingWord]);

  // Helper: check whether the permission modal should be shown
  function shouldShowPermissionModal() {
    if (notificationsEnabled) return false;
    if (!permissionScreenShown) return true;
    // Re-ask only if user tapped "Maybe Later" and 2+ days have passed
    if (!permissionDeniedDate) return false;
    const daysPassed =
      (Date.now() - new Date(permissionDeniedDate).getTime()) / (1000 * 60 * 60 * 24);
    return daysPassed >= 2;
  }

  if (!currentAyah) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No ayah loaded</Text>
          <Text style={styles.emptyText}>Select your mood to begin.</Text>
          <TouchableOpacity
            style={styles.moodButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.moodButtonText}>Select Mood</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleBookmark = () => {
    bookmarked ? removeBookmark(currentAyah.verseKey) : addBookmark(currentAyah);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      {/* Pre-permission modal — shown once after first ayah */}
      <NotificationPermissionModal
        visible={showPermissionModal}
        onDismiss={() => setShowPermissionModal(false)}
      />

      {/* Add to Collection bottom sheet */}
      <AddToCollectionSheet
        visible={showCollectionSheet}
        ayah={currentAyah}
        onClose={() => setShowCollectionSheet(false)}
        onCreateNew={() =>
          (navigation as any).navigate('CreateCollection', { ayahToAdd: currentAyah })
        }
      />

      {/* Tafsir popup */}
      <TafsirModal
        visible={showTafsir}
        verseKey={currentAyah.verseKey}
        surahName={currentAyah.surahName}
        onClose={() => setShowTafsir(false)}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>For You</Text>
        <TouchableOpacity onPress={toggleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={bookmarked ? 'heart' : 'heart-outline'}
            size={26}
            color={bookmarked ? '#E53E3E' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme badge row: theme on left, change feeling on right */}
        <View style={styles.themeRow}>
          {currentAyah.theme && (
            <View style={styles.themeBadge}>
              <Ionicons name="leaf" size={13} color="#2E7D32" />
              <Text style={styles.themeBadgeText}>Theme: {currentAyah.theme}</Text>
            </View>
          )}
          {selectedMood && (
            <TouchableOpacity
              style={styles.changeMoodBtn}
              onPress={() => navigation.navigate('Home')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="color-wand-outline" size={14} color="#2E7D32" />
              <Text style={styles.changeMoodText}>{selectedMood}</Text>
              <Ionicons name="chevron-down" size={12} color="#2E7D32" />
            </TouchableOpacity>
          )}
        </View>

        {/* Animated ayah card */}
        <Animated.View
          style={[
            styles.ayahCard,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Arabic text */}
          <Text style={styles.arabicText}>{currentAyah.arabicText}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Translation */}
          <Text style={styles.translationText}>{currentAyah.translation}</Text>

          {/* Reference */}
          <Text style={styles.reference}>
            — {currentAyah.surahName} ({currentAyah.verseKey})
          </Text>

          {/* Toggle buttons */}
          <View style={styles.langToggle}>
            <TouchableOpacity style={[styles.langBtn, styles.langBtnActive]}>
              <Text style={styles.langBtnTextActive}>Arabic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.langBtn}>
              <Text style={styles.langBtnText}>Translation</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Audio Player */}
        <View style={styles.section}>
          <AudioPlayer audioUrl={currentAyah.audioUrl} />
        </View>

        {/* Word by Word */}
        <View style={styles.wbwCard}>
          <TouchableOpacity
            style={styles.wbwHeader}
            onPress={async () => {
              const next = !showExplanation;
              setShowExplanation(next);
              if (next && wordByWord.length === 0 && !wbwLoading) {
                setWbwLoading(true);
                const words = await fetchWordByWord(currentAyah.verseKey);
                setWordByWord(words);
                setWbwLoading(false);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.wbwHeaderLeft}>
              <View style={styles.wbwIconWrap}>
                <Ionicons name="language-outline" size={17} color="#2E7D32" />
              </View>
              <View>
                <Text style={styles.wbwHeaderTitle}>Word by Word</Text>
                <Text style={styles.wbwHeaderSub}>Tap each word to explore meaning</Text>
              </View>
            </View>
            <View style={styles.wbwHeaderRight}>
              {!showExplanation && wordByWord.length > 0 && (
                <View style={styles.wbwBadge}>
                  <Text style={styles.wbwBadgeText}>{wordByWord.length}</Text>
                </View>
              )}
              <Ionicons
                name={showExplanation ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#9CA3AF"
              />
            </View>
          </TouchableOpacity>

          {showExplanation && (
            <>
              <View style={styles.wbwDivider} />
              {wbwLoading ? (
                <View style={styles.wbwLoadingRow}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <WbwSkeletonChip key={i} />
                  ))}
                </View>
              ) : (
                <View style={styles.wbwContainer}>
                  {wordByWord.map((w) => {
                    const isPlaying = playingWord?.pos === w.position;
                    return (
                      <TouchableOpacity
                        key={w.position}
                        style={[styles.wbwWord, isPlaying && styles.wbwWordActive]}
                        activeOpacity={0.75}
                        onPress={() => {
                          if (!w.audioUrl) return;
                          setPlayingWord(isPlaying ? null : { pos: w.position, url: w.audioUrl });
                        }}
                      >
                        <View style={styles.wbwPosBadge}>
                          <Text style={styles.wbwPosText}>{w.position}</Text>
                        </View>
                        {isPlaying ? (
                          <Text style={[styles.wbwArabic, styles.wbwArabicActive]}>{w.arabic}</Text>
                        ) : (
                          <Text style={styles.wbwArabic}>{w.arabic}</Text>
                        )}
                        <View style={styles.wbwWordDivider} />
                        <Text style={[styles.wbwTranslit, isPlaying && styles.wbwTranslitActive]}>{w.transliteration}</Text>
                        <Text style={styles.wbwMeaning}>{w.translation}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Row 1: Bookmark + Reflect + Tafsir */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFlex]} onPress={toggleBookmark}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={bookmarked ? '#2E7D32' : '#6B7280'}
              />
              <Text style={[styles.actionLabel, bookmarked && styles.actionLabelActive]}>
                {bookmarked ? 'Saved' : 'Bookmark'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnFlex]}
              onPress={() => (navigation as any).navigate('Reflection', { ayah: currentAyah })}
            >
              <Ionicons name="pencil-outline" size={20} color="#6B7280" />
              <Text style={styles.actionLabel}>Reflect</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnFlex]}
              onPress={() => setShowTafsir(true)}
            >
              <Ionicons name="book-outline" size={20} color="#6B7280" />
              <Text style={styles.actionLabel}>Tafsir</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Save to Playlist + Next Ayah */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnFlex]}
              onPress={() => setShowCollectionSheet(true)}
            >
              <Ionicons name="albums-outline" size={20} color="#6B7280" />
              <Text style={styles.actionLabel}>Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.nextBtn, styles.actionBtnFlex]} onPress={() => { scrollRef.current?.scrollTo({ y: 0, animated: false }); nextAyah(); if (shouldShowPermissionModal()) setShowPermissionModal(true); }}>
              <Text style={styles.nextBtnText}>Next Ayah</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  moodButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  moodButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F5F7F2',
  },
  changeMoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  changeMoodText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  themeBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  ayahCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 52,
    textAlign: 'center',
    color: '#1B1B1B',
    writingDirection: 'rtl',
    fontWeight: '400',
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 14,
  },
  translationText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  reference: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 16,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  langBtnActive: {
    backgroundColor: '#2E7D32',
    borderColor: '#2E7D32',
  },
  langBtnText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  langBtnTextActive: { fontSize: 13, color: '#fff', fontWeight: '600' },
  section: {
    // wraps AudioPlayer
  },
  explanationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 12,
  },
  // ── Word-by-Word card ──────────────────────────────────────────────
  wbwCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
  },
  wbwHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  wbwHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  wbwIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wbwHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.2,
  },
  wbwHeaderSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  wbwHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wbwBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  wbwBadgeText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '700',
  },
  wbwDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  wbwContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  wbwWord: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 68,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 3,
    borderTopColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  wbwWordActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
    borderTopColor: '#1B5E20',
    shadowOpacity: 0.1,
    elevation: 3,
  },
  wbwPosBadge: {
    position: 'absolute',
    top: -1,
    right: 6,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  wbwPosText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  wbwArabic: {
    fontSize: 22,
    color: '#1B1B1B',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 6,
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  wbwArabicActive: {
    color: '#2E7D32',
  },
  wbwWordDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 5,
  },
  wbwTranslit: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 3,
    textAlign: 'center',
  },
  wbwTranslitActive: {
    color: '#2E7D32',
  },
  wbwMeaning: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 80,
  },
  wbwLoadingRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    padding: 16,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  actionBtnFlex: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  actionLabelActive: { color: '#2E7D32' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
  },
  nextBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
});
