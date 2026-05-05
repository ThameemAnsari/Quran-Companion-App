import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList, Mood } from '../types';
import { MOOD_OPTIONS } from '../services/aiService';
import { MoodCard } from '../components/MoodCard';
import { useAppStore } from '../store/useAppStore';
import { fetchLanguages, LanguageOption } from '../services/quranApi';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { setMood, checkAndUpdateStreak, selectedTranslationName, setTranslation } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loadingTranslations, setLoadingTranslations] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    checkAndUpdateStreak();
    // Load translations once
    setLoadingTranslations(true);
    fetchLanguages()
      .then(setLanguages)
      .finally(() => setLoadingTranslations(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const handleMoodSelect = (mood: Mood) => {
    setMood(mood);
    navigation.navigate('Loading', { mood });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Bismillah */}
        <Text style={styles.bismillah}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>

        {/* Illustration / icon */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../assets/app_icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>How are you feeling today?</Text>
        <Text style={styles.subtitle}>
          Choose your heart's state — we'll find the right ayahs for you
        </Text>

        {/* Translation language picker */}
        <TouchableOpacity
          style={styles.langSelector}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.75}
        >
          <Ionicons name="language-outline" size={16} color="#2E7D32" />
          <Text style={styles.langSelectorText} numberOfLines={1}>
            {selectedTranslationName}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#6B7280" />
        </TouchableOpacity>

        {/* Mood cards */}
        <View style={styles.moodList}>
          {MOOD_OPTIONS.map((option) => (
            <MoodCard
              key={option.label}
              option={option}
              onPress={() => handleMoodSelect(option.label)}
            />
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          "Verily, in the remembrance of Allah do hearts find rest." — 13:28
        </Text>
      </ScrollView>

      {/* Translation picker modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Translation Language</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loadingTranslations ? (
            <ActivityIndicator color="#2E7D32" style={{ marginVertical: 32 }} />
          ) : (
            <FlatList
              data={languages}
              keyExtractor={(item) => String(item.id)}
              style={styles.langList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    item.language === selectedTranslationName && styles.langItemActive,
                  ]}
                  onPress={() => {
                    setTranslation(item.id, item.language);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.langItemName,
                    item.language === selectedTranslationName && styles.langItemNameActive,
                  ]}>
                    {item.language}
                  </Text>
                  {item.language === selectedTranslationName && (
                    <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.langDivider} />}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
    alignItems: 'center',
  },
  bismillah: {
    fontSize: 18,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
    writingDirection: 'rtl',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appIcon: {
    width: 110,
    height: 110,
    borderRadius: 26,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  moodList: {
    width: '100%',
    marginBottom: 32,
  },
  footer: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    alignSelf: 'center',
    maxWidth: 280,
  },
  langSelectorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  langList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  langItemActive: {
    backgroundColor: '#F0FDF4',
  },
  langItemInfo: {
    flex: 1,
  },
  langItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1B1B1B',
    marginBottom: 2,
  },
  langItemNameActive: {
    color: '#2E7D32',
  },
  langItemSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  langDivider: {
    height: 1,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 8,
  },
});
