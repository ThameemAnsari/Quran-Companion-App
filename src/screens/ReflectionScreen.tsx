import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList, Reflection } from '../types';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Reflection'>;

export const ReflectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { ayah } = route.params;
  const { addReflection } = useAppStore();

  const [lesson, setLesson] = useState('');
  const [application, setApplication] = useState('');
  const [saveEnabled, setSaveEnabled] = useState(true);

  const handleSave = () => {
    if (!lesson.trim() && !application.trim()) {
      Alert.alert('Empty reflection', 'Please write something before saving.');
      return;
    }
    if (saveEnabled) {
      const reflection: Reflection = {
        id: `${ayah.verseKey}-${Date.now()}`,
        ayah,
        lesson: lesson.trim(),
        application: application.trim(),
        createdAt: new Date().toISOString(),
      };
      addReflection(reflection);
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color="#1B1B1B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reflect</Text>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Ayah preview */}
          <View style={styles.ayahPreview}>
            <Text style={styles.ayahRef}>
              {ayah.surahName} ({ayah.verseKey})
            </Text>
            <Text style={styles.ayahArabic} numberOfLines={3}>
              {ayah.arabicText}
            </Text>
            <Text style={styles.ayahTranslation} numberOfLines={2}>
              {ayah.translation}
            </Text>
          </View>

          {/* Question 1 */}
          <View style={styles.inputBlock}>
            <Text style={styles.questionLabel}>
              What did you learn from this ayah?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Write your thoughts here..."
              placeholderTextColor="#C4C4C4"
              multiline
              numberOfLines={4}
              value={lesson}
              onChangeText={setLesson}
              textAlignVertical="top"
            />
          </View>

          {/* Question 2 */}
          <View style={styles.inputBlock}>
            <Text style={styles.questionLabel}>
              How does this apply to your life today?
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your answer..."
              placeholderTextColor="#C4C4C4"
              multiline
              numberOfLines={4}
              value={application}
              onChangeText={setApplication}
              textAlignVertical="top"
            />
          </View>

          {/* Save toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Save to my reflections</Text>
            <Switch
              value={saveEnabled}
              onValueChange={setSaveEnabled}
              trackColor={{ false: '#E5E7EB', true: '#2E7D32' }}
              thumbColor="#fff"
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save Reflection</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5F7F2',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  saveHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#2E7D32',
    borderRadius: 20,
  },
  saveHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 14,
  },
  ayahPreview: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  ayahRef: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ayahArabic: {
    fontSize: 20,
    lineHeight: 34,
    color: '#1B1B1B',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  },
  ayahTranslation: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
  inputBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  questionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 10,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1B1B1B',
    lineHeight: 22,
    minHeight: 100,
    borderWidth: 1.5,
    borderColor: '#F3F4F6',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1B1B',
  },
  saveBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
