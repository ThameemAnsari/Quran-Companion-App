import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Ayah } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/AudioPlayer';
import { TafsirModal } from '../components/TafsirModal';
import { fetchWordByWord, type WordData } from '../services/quranApi';

type Props = NativeStackScreenProps<RootStackParamList, 'CollectionDetail'>;

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
      <View style={skeletonStyles.badge} />
      <View style={skeletonStyles.arabic} />
      <View style={skeletonStyles.divider} />
      <View style={skeletonStyles.line} />
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

function AyahCard({
  ayah,
  onRemove,
  onReflect,
}: {
  ayah: Ayah;
  onRemove: () => void;
  onReflect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [showWbw, setShowWbw] = useState(false);
  const [wordByWord, setWordByWord] = useState<WordData[]>([]);
  const [wbwLoading, setWbwLoading] = useState(false);
  const [playingWord, setPlayingWord] = useState<{ pos: number; url: string } | null>(null);
  const wordPlayer = useAudioPlayer(null);
  const wordStatus = useAudioPlayerStatus(wordPlayer);

  // Auto-reset highlight when word audio finishes
  useEffect(() => {
    if (wordStatus.didJustFinish) setPlayingWord(null);
  }, [wordStatus.didJustFinish]);

  // Drive audio from state — URL stored directly in state, no stale-closure lookup
  useEffect(() => {
    if (!playingWord) {
      wordPlayer.pause();
      return;
    }
    wordPlayer.replace({ uri: playingWord.url });
    wordPlayer.play();
  }, [playingWord]);

  return (
    <View style={styles.card}>
      {/* Tafsir popup */}
      <TafsirModal
        visible={showTafsir}
        verseKey={ayah.verseKey}
        surahName={ayah.surahName}
        onClose={() => setShowTafsir(false)}
      />

      {/* Collapsed row */}
      <TouchableOpacity
        style={styles.cardRow}
        activeOpacity={0.75}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>📖</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{ayah.surahName}</Text>
          <Text style={styles.cardMeta}>{ayah.verseKey}</Text>
          <Text style={styles.cardPreview} numberOfLines={1}>{ayah.translation}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#D1D5DB"
        />
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.arabicText}>{ayah.arabicText}</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>{ayah.translation}</Text>
          <View style={styles.audioWrap}>
            <AudioPlayer audioUrl={ayah.audioUrl} />
          </View>

          {/* Word by Word card */}
          <View style={styles.wbwCard}>
            <TouchableOpacity
              style={styles.wbwHeader}
              onPress={async () => {
                const next = !showWbw;
                setShowWbw(next);
                if (next && wordByWord.length === 0 && !wbwLoading) {
                  setWbwLoading(true);
                  const words = await fetchWordByWord(ayah.verseKey);
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
                  <Text style={styles.wbwHeaderSub}>Tap each word to hear pronunciation</Text>
                </View>
              </View>
              <View style={styles.wbwHeaderRight}>
                {!showWbw && wordByWord.length > 0 && (
                  <View style={styles.wbwBadge}>
                    <Text style={styles.wbwBadgeText}>{wordByWord.length}</Text>
                  </View>
                )}
                <Ionicons
                  name={showWbw ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#9CA3AF"
                />
              </View>
            </TouchableOpacity>

            {showWbw && (
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

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onReflect}>
              <Ionicons name="pencil-outline" size={16} color="#2E7D32" />
              <Text style={styles.actionBtnText}>Reflect</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowTafsir(true)}>
              <Ionicons name="book-outline" size={16} color="#2E7D32" />
              <Text style={styles.actionBtnText}>Tafsir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.removeBtn]}
              onPress={() =>
                Alert.alert('Remove Ayah', 'Remove this ayah from the collection?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Remove', style: 'destructive', onPress: onRemove },
                ])
              }
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
              <Text style={[styles.actionBtnText, styles.removeBtnText]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export const CollectionDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { collectionId } = route.params;
  const { collections, removeAyahFromCollection, deleteCollection } = useAppStore();
  const collection = collections.find((c) => c.id === collectionId);

  if (!collection) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Collection not found.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Collection',
      `Delete "${collection.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCollection(collectionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#1B1B1B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>{collection.emoji}</Text>
          <Text style={styles.headerTitle}>{collection.name}</Text>
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Count badge */}
      <View style={styles.countRow}>
        <Ionicons name="library-outline" size={14} color="#2E7D32" />
        <Text style={styles.countText}>
          {collection.ayahs.length} {collection.ayahs.length === 1 ? 'ayah' : 'ayahs'} saved
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {collection.ayahs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No ayahs yet</Text>
            <Text style={styles.emptyText}>
              Add ayahs from the Home screen by tapping "Add to Collection"
            </Text>
          </View>
        )}

        {collection.ayahs.map((ayah) => (
          <AyahCard
            key={ayah.verseKey}
            ayah={ayah}
            onRemove={() => removeAyahFromCollection(collectionId, ayah.verseKey)}
            onReflect={() => (navigation as any).navigate('Reflection', { ayah })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F7F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  headerEmoji: { fontSize: 22 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  countText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  // Card — same style as BookmarkScreen
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginBottom: 2 },
  cardMeta: { fontSize: 13, color: '#2E7D32', fontWeight: '600', marginBottom: 3 },
  cardPreview: { fontSize: 12, color: '#9CA3AF', lineHeight: 17 },
  expandedSection: { paddingHorizontal: 16, paddingBottom: 16 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  arabicText: {
    fontSize: 22,
    lineHeight: 40,
    color: '#1B1B1B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationText: { fontSize: 14, lineHeight: 22, color: '#374151' },
  audioWrap: { marginTop: 14, marginBottom: 14 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  removeBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  removeBtnText: { color: '#EF4444' },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  notFoundText: { fontSize: 16, color: '#6B7280' },
  backLink: { fontSize: 15, color: '#2E7D32', fontWeight: '600' },

  // ── Word by Word ────────────────────────────────────────────────
  wbwCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 12,
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
});
