import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchChapters } from '../services/quranApi';
import type { Chapter } from '../types';

export const QuranScreen: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filtered, setFiltered] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchChapters()
      .then((data) => {
        setChapters(data);
        setFiltered(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(chapters);
    } else {
      const q = text.toLowerCase();
      setFiltered(
        chapters.filter(
          (c) =>
            c.name_simple.toLowerCase().includes(q) ||
            String(c.id).includes(q)
        )
      );
    }
  };

  const renderChapter = ({ item }: { item: Chapter }) => (
    <TouchableOpacity style={styles.chapterRow} activeOpacity={0.7}>
      <View style={styles.numberBadge}>
        <Text style={styles.numberText}>{item.id}</Text>
      </View>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterName}>{item.name_simple}</Text>
        <Text style={styles.chapterMeta}>
          {item.revelation_place} · {item.verses_count} verses
        </Text>
      </View>
      <Text style={styles.arabicName}>{item.name_arabic}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quran</Text>
        <Text style={styles.headerSub}>114 Surahs</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search surah..."
          placeholderTextColor="#C4C4C4"
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading surahs…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderChapter}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B1B1B',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1B1B1B' },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  numberBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  chapterInfo: { flex: 1 },
  chapterName: { fontSize: 15, fontWeight: '600', color: '#1B1B1B' },
  chapterMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2, textTransform: 'capitalize' },
  arabicName: {
    fontSize: 18,
    color: '#1B1B1B',
    writingDirection: 'rtl',
    fontWeight: '400',
  },
  separator: { height: 8 },
});
