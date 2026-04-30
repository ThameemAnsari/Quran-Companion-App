import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList } from '../types';
import { getAyahsForMood } from '../services/aiService';
import { useAppStore } from '../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Loading'>;

const STEPS = [
  'Understanding your mood',
  'Searching relevant themes',
  'Finding ayahs for you',
];

export const LoadingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { mood } = route.params;
  const { setAyahList } = useAppStore();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();

    // Float animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(iconFloat, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Step-by-step progress
    const stepTimers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setCurrentStep(i);
        setTimeout(() => setCompletedSteps((prev) => [...prev, i]), 700);
      }, i * 1200);
      stepTimers.push(t);
    });

    // Fetch ayahs and navigate
    let mounted = true;
    getAyahsForMood(mood).then((ayahs) => {
      if (!mounted) return;
      setAyahList(ayahs);
      setTimeout(() => {
        if (mounted) navigation.replace('Main');
      }, STEPS.length * 1200 + 600);
    });

    return () => {
      mounted = false;
      stepTimers.forEach(clearTimeout);
    };
  }, [mood]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Floating illustration */}
        <Animated.View style={[styles.illustration, { transform: [{ translateY: iconFloat }] }]}>
          <Image
            source={require('../../assets/app_icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Finding guidance{'\n'}for you…</Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, i) => {
            const isDone = completedSteps.includes(i);
            const isActive = currentStep === i && !isDone;
            return (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepIcon,
                    isDone && styles.stepIconDone,
                    isActive && styles.stepIconActive,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : isActive ? (
                    <View style={styles.stepDot} />
                  ) : (
                    <View style={styles.stepDotInactive} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepText,
                    isDone && styles.stepTextDone,
                    isActive && styles.stepTextActive,
                  ]}
                >
                  {step}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteArabic}>وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ</Text>
          <Text style={styles.quoteText}>
            And be patient, and your patience is not but through Allah.
          </Text>
          <Text style={styles.quoteRef}>— Surah An-Nahl (16:127)</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  appIcon: {
    width: 160,
    height: 160,
    borderRadius: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B1B1B',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 36,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: '#2E7D32' },
  stepIconActive: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: '#2E7D32' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32' },
  stepDotInactive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
  stepText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  stepTextDone: { color: '#1B1B1B', fontWeight: '600' },
  stepTextActive: { color: '#2E7D32', fontWeight: '600' },
  quoteCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2E7D32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  quoteArabic: {
    fontSize: 18,
    color: '#1B1B1B',
    textAlign: 'center',
    marginBottom: 8,
    writingDirection: 'rtl',
    lineHeight: 30,
  },
  quoteText: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  quoteRef: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 6,
  },
});
