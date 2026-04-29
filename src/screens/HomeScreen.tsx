import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList, Mood } from '../types';
import { MOOD_OPTIONS } from '../services/aiService';
import { MoodCard } from '../components/MoodCard';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { setMood, checkAndUpdateStreak } = useAppStore();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkAndUpdateStreak();
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
          <View style={styles.mosqueShadow} />
          <Text style={styles.mosqueIcon}>🕌</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>How are you feeling today?</Text>
        <Text style={styles.subtitle}>
          Choose your heart's state — we'll find the right ayahs for you
        </Text>

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
    position: 'relative',
  },
  mosqueShadow: {
    position: 'absolute',
    bottom: -8,
    width: 80,
    height: 20,
    borderRadius: 40,
    backgroundColor: 'rgba(46,125,50,0.12)',
  },
  mosqueIcon: {
    fontSize: 80,
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
});
