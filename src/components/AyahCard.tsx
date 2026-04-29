import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ayah } from '../types';
import { useAppStore } from '../store/useAppStore';

interface Props {
  ayah: Ayah;
  showActions?: boolean;
  onReflect?: () => void;
  compact?: boolean;
}

export const AyahCard: React.FC<Props> = ({
  ayah,
  showActions = false,
  onReflect,
  compact = false,
}) => {
  const { addBookmark, removeBookmark, isBookmarked } = useAppStore();
  const bookmarked = isBookmarked(ayah.verseKey);
  const bookmarkScale = React.useRef(new Animated.Value(1)).current;

  const toggleBookmark = () => {
    Animated.sequence([
      Animated.spring(bookmarkScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    bookmarked ? removeBookmark(ayah.verseKey) : addBookmark(ayah);
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {/* Surah reference */}
      <View style={styles.header}>
        <Text style={styles.reference}>
          {ayah.surahName} ({ayah.verseKey})
        </Text>
        {showActions && (
          <TouchableOpacity onPress={toggleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={bookmarked ? '#2E7D32' : '#9CA3AF'}
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>

      {/* Arabic text */}
      <Text style={[styles.arabic, compact && styles.arabicCompact]} numberOfLines={compact ? 3 : undefined}>
        {ayah.arabicText}
      </Text>

      {/* Translation */}
      <Text style={[styles.translation, compact && styles.translationCompact]} numberOfLines={compact ? 2 : undefined}>
        {ayah.translation}
      </Text>

      {/* Actions */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={toggleBookmark}>
            <Ionicons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={bookmarked ? '#2E7D32' : '#6B7280'}
            />
            <Text style={styles.actionLabel}>
              {bookmarked ? 'Saved' : 'Bookmark'}
            </Text>
          </TouchableOpacity>
          {onReflect && (
            <TouchableOpacity style={styles.actionBtn} onPress={onReflect}>
              <Ionicons name="pencil-outline" size={18} color="#6B7280" />
              <Text style={styles.actionLabel}>Reflect</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reference: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  arabic: {
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'right',
    color: '#1B1B1B',
    fontWeight: '400',
    marginBottom: 10,
    writingDirection: 'rtl',
  },
  arabicCompact: {
    fontSize: 20,
    lineHeight: 36,
  },
  translation: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  translationCompact: {
    fontSize: 13,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});
