import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/AudioPlayer';
import { buildAudioUrl } from '../services/quranApi';
import type { Ayah, Reflection } from '../types';

type TabType = 'Ayahs' | 'Reflections';

function AyahRow({
  item,
  onRemove,
}: {
  item: Ayah;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardRow}
        activeOpacity={0.75}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>📖</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.surahName}</Text>
          <Text style={styles.cardMeta}>{item.verseKey}</Text>
          <Text style={styles.cardPreview} numberOfLines={1}>
            {item.translation}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#D1D5DB"
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.arabicText}>{item.arabicText}</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>{item.translation}</Text>
          <View style={styles.audioWrapper}>
            <AudioPlayer audioUrl={item.audioUrl || buildAudioUrl(item.surahNumber, item.verseNumber)} />
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Remove Bookmark</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ReflectionRow({ item }: { item: Reflection }) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardRow}
        activeOpacity={0.75}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardEmoji}>✍️</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.ayah.surahName}</Text>
          <Text style={styles.cardMeta}>{item.ayah.verseKey}</Text>
          <Text style={styles.cardPreview} numberOfLines={1}>
            {item.lesson || item.application || 'Reflection saved'}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardDate}>{date}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#D1D5DB"
            style={{ marginTop: 6 }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          {/* Ayah Arabic + Translation */}
          <Text style={styles.arabicText}>{item.ayah.arabicText}</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>{item.ayah.translation}</Text>
          <View style={styles.divider} />
          {/* Reflection notes */}
          {!!item.lesson && (
            <>
              <Text style={styles.reflectionQ}>What I learned</Text>
              <Text style={styles.reflectionA}>{item.lesson}</Text>
            </>
          )}
          {!!item.application && (
            <>
              <Text style={[styles.reflectionQ, { marginTop: 10 }]}>How it applies</Text>
              <Text style={styles.reflectionA}>{item.application}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export const BookmarkScreen: React.FC = () => {
  const { bookmarks, reflections, removeBookmark } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('Ayahs');

  const handleRemove = (verseKey: string) => {
    Alert.alert('Remove Bookmark', 'Remove this ayah from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeBookmark(verseKey) },
    ]);
  };

  const emptyAyahs = (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔖</Text>
      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
      <Text style={styles.emptyText}>Tap the heart icon on any ayah to save it here.</Text>
    </View>
  );

  const emptyReflections = (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✍️</Text>
      <Text style={styles.emptyTitle}>No reflections yet</Text>
      <Text style={styles.emptyText}>After reading an ayah, tap "Reflect" to journal your thoughts.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <Text style={styles.headerSubtitle}>Your saved ayahs & reflections</Text>
      </View>

      <View style={styles.tabs}>
        {(['Ayahs', 'Reflections'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Ayahs' ? (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.verseKey}
          renderItem={({ item }) => (
            <AyahRow item={item} onRemove={() => handleRemove(item.verseKey)} />
          )}
          contentContainerStyle={[styles.list, bookmarks.length === 0 && styles.listEmpty]}
          ListEmptyComponent={emptyAyahs}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={reflections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ReflectionRow item={item} />}
          contentContainerStyle={[styles.list, reflections.length === 0 && styles.listEmpty]}
          ListEmptyComponent={emptyReflections}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  listEmpty: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
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
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 3,
  },
  cardPreview: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 17,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  cardDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  expandedSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  arabicText: {
    fontSize: 22,
    lineHeight: 40,
    color: '#1B1B1B',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  audioWrapper: {
    marginTop: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  reflectionQ: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reflectionA: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
    gap: 10,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
});
