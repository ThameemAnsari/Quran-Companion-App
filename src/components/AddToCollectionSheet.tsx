import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ayah } from '../types';
import { useAppStore } from '../store/useAppStore';
import { MOOD_OPTIONS } from '../services/aiService';

interface Props {
  visible: boolean;
  ayah: Ayah | null;
  onClose: () => void;
  onCreateNew: () => void;
}

export const AddToCollectionSheet: React.FC<Props> = ({
  visible,
  ayah,
  onClose,
  onCreateNew,
}) => {
  const { collections, addAyahToCollection, createCollection, selectedMood } = useAppStore();
  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Selection state: either a collection id or a mood label
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(
    selectedMood ?? null
  );

  useEffect(() => {
    if (visible) {
      // Pre-select current mood on open
      setSelectedColId(null);
      setSelectedMoodKey(selectedMood ?? null);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setSelectedColId(null);
      setSelectedMoodKey(null);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleAdd = (collectionId: string) => {
    if (!ayah) return;
    addAyahToCollection(collectionId, ayah);
    onClose();
  };

  // Confirm save based on current selection
  const handleSave = () => {
    if (!ayah) return;
    if (selectedColId) {
      addAyahToCollection(selectedColId, ayah);
      onClose();
      return;
    }
    if (selectedMoodKey) {
      const opt = MOOD_OPTIONS.find((o) => o.label === selectedMoodKey);
      const existing = collections.find((c) => c.name === selectedMoodKey);
      if (existing) {
        addAyahToCollection(existing.id, ayah);
      } else {
        const newCol = createCollection(selectedMoodKey, opt?.emoji ?? '📖');
        addAyahToCollection(newCol.id, ayah);
      }
      onClose();
    }
  };

  const hasSelection = !!(selectedColId || selectedMoodKey);

  const isInCollection = (collectionId: string) =>
    collections.find((c) => c.id === collectionId)?.ayahs.some((a) => a.verseKey === ayah?.verseKey) ?? false;



  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Title */}
        <View style={styles.sheetHeader}>
          <Ionicons name="albums-outline" size={20} color="#2E7D32" />
          <Text style={styles.sheetTitle}>Add to Collection</Text>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Ayah reference */}
        {ayah && (
          <View style={styles.ayahRef}>
            <Text style={styles.ayahRefText}>
              {ayah.surahName} · {ayah.verseKey}
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.list}
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          {collections.length === 0 && (
            <Text style={styles.emptyNote}>No collections yet. Create one below.</Text>
          )}

          {collections.map((col) => {
            const already = isInCollection(col.id);
            const isChosen = selectedColId === col.id;
            return (
              <TouchableOpacity
                key={col.id}
                style={[
                  styles.colRow,
                  already && styles.colRowAdded,
                  isChosen && styles.colRowSelected,
                ]}
                onPress={() => {
                  if (already) return;
                  setSelectedColId(isChosen ? null : col.id);
                  setSelectedMoodKey(null);
                }}
                activeOpacity={already ? 1 : 0.75}
              >
                <Text style={styles.colEmoji}>{col.emoji}</Text>
                <View style={styles.colInfo}>
                  <Text style={styles.colName}>{col.name}</Text>
                  <Text style={styles.colCount}>
                    {col.ayahs.length} {col.ayahs.length === 1 ? 'ayah' : 'ayahs'}
                  </Text>
                </View>
                {already ? (
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                ) : isChosen ? (
                  <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                ) : (
                  <Ionicons name="radio-button-off" size={20} color="#D1D5DB" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Create new */}
        <TouchableOpacity
          style={styles.createRow}
          onPress={() => {
            onClose();
            onCreateNew();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.createIconWrap}>
            <Ionicons name="add" size={20} color="#2E7D32" />
          </View>
          <Text style={styles.createText}>Create New Collection</Text>
        </TouchableOpacity>

        {/* Mood quick-save */}
        <View style={styles.moodSection}>
          <Text style={styles.moodSectionLabel}>Save by Feeling</Text>
          <View style={styles.moodGrid}>
            {MOOD_OPTIONS.map((opt) => {
              const isChosen = selectedMoodKey === opt.label;
              const moodCol = collections.find((c) => c.name === opt.label);
              const alreadySaved = moodCol?.ayahs.some((a) => a.verseKey === ayah?.verseKey) ?? false;
              return (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.moodChip,
                    isChosen && styles.moodChipSelected,
                    alreadySaved && styles.moodChipSaved,
                  ]}
                  onPress={() => {
                    if (alreadySaved) return;
                    setSelectedMoodKey(isChosen ? null : opt.label);
                    setSelectedColId(null);
                  }}
                  activeOpacity={alreadySaved ? 1 : 0.75}
                >
                  <Text style={styles.moodChipEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.moodChipText,
                      isChosen && styles.moodChipTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {alreadySaved && (
                    <Ionicons name="checkmark-circle" size={13} color="#2E7D32" style={{ marginLeft: 2 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sticky Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, !hasSelection && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={hasSelection ? 0.85 : 1}
          disabled={!hasSelection}
        >
          <Ionicons name="bookmark" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>
            {selectedColId
              ? `Save to "${collections.find((c) => c.id === selectedColId)?.name ?? 'Collection'}"`
              : selectedMoodKey
              ? `Save to "${selectedMoodKey}"`
              : 'Select a collection above'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  ayahRef: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  ayahRefText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  list: { maxHeight: 260 },
  emptyNote: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  colRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  colRowAdded: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
  },
  colRowSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  colEmoji: { fontSize: 24 },
  colInfo: { flex: 1 },
  colName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  colCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
  },
  createIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  moodSection: {
    marginTop: 16,
  },
  moodSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodChipSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  moodChipSaved: {
    backgroundColor: '#F0FDF4',
    borderColor: '#A7F3D0',
    opacity: 0.7,
  },
  moodChipEmoji: { fontSize: 14 },
  moodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    maxWidth: 90,
  },
  moodChipTextSelected: {
    color: '#2E7D32',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 16,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
