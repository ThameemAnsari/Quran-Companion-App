import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Ayah } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/AudioPlayer';

type Props = NativeStackScreenProps<RootStackParamList, 'CollectionDetail'>;

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

  return (
    <View style={styles.card}>
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
          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={onReflect}>
              <Ionicons name="pencil-outline" size={16} color="#2E7D32" />
              <Text style={styles.actionBtnText}>Reflect</Text>
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
});
