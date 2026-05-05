import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCollection'>;

const EMOJI_OPTIONS = [
  '😔', '😢', '😡', '😕', '🌱', '🤍', '🥺', '😨', '🥲', '😌',
  '🌙', '❤️', '🌿', '📖', '🕌', '🤲', '✨', '💫', '🌸', '🌊',
];

export const CreateCollectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { ayahToAdd } = route.params ?? {};
  const { createCollection, addAyahToCollection } = useAppStore();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📖');

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a collection name.');
      return;
    }
    const newCol = createCollection(trimmed, selectedEmoji);
    if (ayahToAdd) {
      addAyahToCollection(newCol.id, ayahToAdd);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Collection</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview */}
          <View style={styles.preview}>
            <Text style={styles.previewEmoji}>{selectedEmoji}</Text>
            <Text style={styles.previewName} numberOfLines={1}>
              {name.trim() || 'Collection Name'}
            </Text>
          </View>

          {/* Name input */}
          <View style={styles.section}>
            <Text style={styles.label}>Collection Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Stress Relief, Night Reflections..."
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              maxLength={40}
              returnKeyType="done"
              autoFocus
            />
          </View>

          {/* Emoji selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Choose an Emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiBtn,
                    selectedEmoji === emoji && styles.emojiBtnSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiOption}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {ayahToAdd && (
            <View style={styles.ayahNote}>
              <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
              <Text style={styles.ayahNoteText}>
                "{ayahToAdd.surahName} {ayahToAdd.verseKey}" will be added
              </Text>
            </View>
          )}

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createBtn, !name.trim() && styles.createBtnDisabled]}
            onPress={handleCreate}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create Collection</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  preview: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  previewEmoji: { fontSize: 52 },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    maxWidth: '80%',
  },
  section: { gap: 10 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1B1B1B',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emojiBtnSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0FDF4',
  },
  emojiOption: { fontSize: 26 },
  ayahNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ayahNoteText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  createBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
