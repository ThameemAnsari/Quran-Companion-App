import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, MainTabParamList } from '../types';
import { useAppStore } from '../store/useAppStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Collections'>,
  NativeStackScreenProps<RootStackParamList>
>;

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export const CollectionsScreen: React.FC<Props> = ({ navigation }) => {
  const { collections, touchCollection } = useAppStore();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Collections</Text>
          <Text style={styles.headerSubtitle}>Revisit ayahs by your feelings</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Create button */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateCollection', {})}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={22} color="#2E7D32" />
          <Text style={styles.createBtnText}>Create Collection</Text>
        </TouchableOpacity>

        {/* Empty state */}
        {collections.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🗂️</Text>
            <Text style={styles.emptyTitle}>No collections yet</Text>
            <Text style={styles.emptyText}>
              Save ayahs into collections to revisit them by feeling
            </Text>
          </View>
        )}

        {/* Collection cards */}
        {collections.map((col) => (
          <TouchableOpacity
            key={col.id}
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => {
              touchCollection(col.id);
              navigation.navigate('CollectionDetail', { collectionId: col.id });
            }}
          >
            <View style={styles.cardEmoji}>
              <Text style={styles.emoji}>{col.emoji}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{col.name}</Text>
              <Text style={styles.cardMeta}>
                {col.ayahs.length} {col.ayahs.length === 1 ? 'ayah' : 'ayahs'}
              </Text>
              <Text style={styles.cardTime}>Last opened {timeAgo(col.lastOpenedAt)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#F5F7F2',
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
    gap: 12,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  createBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
  cardBody: { flex: 1 },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 3,
  },
  cardMeta: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
