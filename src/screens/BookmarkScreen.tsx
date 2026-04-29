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
import type { Ayah, Reflection } from '../types';

type TabType = 'Ayahs' | 'Reflections';

export const BookmarkScreen: React.FC = () => {
  const { bookmarks, reflections, removeBookmark } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('Ayahs');

  const handleRemove = (verseKey: string) => {
    Alert.alert('Remove Bookmark', 'Remove this ayah from bookmarks?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeBookmark(verseKey) },
    ]);
  };

  const renderAyah = ({ item }: { item: Ayah }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardRef}>
          <Text style={styles.cardRefText}>{item.surahName} ({item.verseKey})</Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemove(item.verseKey)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bookmark" size={22} color="#2E7D32" />
        </TouchableOpacity>
      </View>
      <Text style={styles.arabicText} numberOfLines={3}>
        {item.arabicText}
      </Text>
      <Text style={styles.translationText} numberOfLines={2}>
        {item.translation}
      </Text>
    </View>
  );

  const renderReflection = ({ item }: { item: Reflection }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardRef}>
          <Text style={styles.cardRefText}>
            {item.ayah.surahName} ({item.ayah.verseKey})
          </Text>
        </View>
        <Ionicons name="pencil" size={16} color="#9CA3AF" />
      </View>
      {!!item.lesson && (
        <>
          <Text style={styles.reflectionQ}>What I learned:</Text>
          <Text style={styles.reflectionA} numberOfLines={2}>{item.lesson}</Text>
        </>
      )}
      {!!item.application && (
        <>
          <Text style={[styles.reflectionQ, { marginTop: 8 }]}>How it applies:</Text>
          <Text style={styles.reflectionA} numberOfLines={2}>{item.application}</Text>
        </>
      )}
      <Text style={styles.dateText}>
        {new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </Text>
    </View>
  );

  const emptyAyahs = (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔖</Text>
      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
      <Text style={styles.emptyText}>
        Tap the bookmark icon on any ayah to save it here.
      </Text>
    </View>
  );

  const emptyReflections = (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✍️</Text>
      <Text style={styles.emptyTitle}>No reflections yet</Text>
      <Text style={styles.emptyText}>
        After reading an ayah, tap "Reflect" to journal your thoughts.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
      </View>

      {/* Tabs */}
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

      {/* List */}
      {activeTab === 'Ayahs' ? (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.verseKey}
          renderItem={renderAyah}
          contentContainerStyle={[styles.list, bookmarks.length === 0 && styles.listEmpty]}
          ListEmptyComponent={emptyAyahs}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={reflections}
          keyExtractor={(item) => item.id}
          renderItem={renderReflection}
          contentContainerStyle={[styles.list, reflections.length === 0 && styles.listEmpty]}
          ListEmptyComponent={emptyReflections}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Bookmark CTA */}
      {activeTab === 'Ayahs' && bookmarks.length > 0 && (
        <View style={styles.addBookmarkRow}>
          <TouchableOpacity style={styles.addBookmarkBtn} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBookmarkText}>Add New Bookmark</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
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
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardRef: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  cardRefText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 0.3,
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 36,
    color: '#1B1B1B',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  reflectionQ: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  reflectionA: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  dateText: {
    fontSize: 11,
    color: '#D1D5DB',
    marginTop: 10,
    textAlign: 'right',
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  addBookmarkRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  addBookmarkBtn: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  addBookmarkText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
