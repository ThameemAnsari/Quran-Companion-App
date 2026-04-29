import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

const { width: SCREEN_W } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // ── Animation values ────────────────────────────────────────────────────────
  const ring1Opacity  = useRef(new Animated.Value(0)).current;
  const ring2Opacity  = useRef(new Animated.Value(0)).current;
  const logoScale     = useRef(new Animated.Value(0.6)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const bismillahOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dividerScale  = useRef(new Animated.Value(0)).current;
  const shimmerAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim     = useRef(new Animated.Value(1)).current;

  const ease = Easing.out(Easing.cubic);

  useEffect(() => {
    // Shimmer loop on the outer ring
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );

    // Gentle pulse on the logo circle
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 1600, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );

    // Entrance sequence
    Animated.sequence([
      // Rings appear
      Animated.parallel([
        Animated.timing(ring1Opacity, { toValue: 1, duration: 500, useNativeDriver: true, easing: ease }),
        Animated.timing(ring2Opacity, { toValue: 0.5, duration: 700, useNativeDriver: true, easing: ease }),
      ]),
      // Logo bounces in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 65, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // Bismillah fades in
      Animated.timing(bismillahOpacity, { toValue: 1, duration: 500, delay: 80, useNativeDriver: true }),
      // Divider grows
      Animated.spring(dividerScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
      // Title slides up + fades
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 380, useNativeDriver: true, easing: ease }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 380, useNativeDriver: true, easing: ease }),
      ]),
      // Tagline fades in
      Animated.timing(taglineOpacity, { toValue: 1, duration: 340, delay: 60, useNativeDriver: true }),
    ]).start(() => {
      shimmerLoop.start();
      pulseLoop.start();
    });

    // Navigate to Home after 2.8 s
    const timer = setTimeout(() => {
      navigation.replace('Home');
    }, 2800);

    return () => {
      clearTimeout(timer);
      shimmerLoop.stop();
      pulseLoop.stop();
    };
  }, []);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.85],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#EEF2E8', '#F5F7F2', '#F0F5EC']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTopRight]} />
      <View style={[styles.blob, styles.blobBottomLeft]} />

      {/* ── Center content ──────────────────────────────────────────────── */}
      <View style={styles.center}>

        {/* Outer shimmer ring */}
        <Animated.View
          style={[styles.ring, styles.ringOuter, { opacity: shimmerOpacity }]}
          pointerEvents="none"
        />

        {/* Middle ring */}
        <Animated.View
          style={[styles.ring, styles.ringMid, { opacity: ring1Opacity }]}
          pointerEvents="none"
        />

        {/* Inner ring */}
        <Animated.View
          style={[styles.ring, styles.ringInner, { opacity: ring2Opacity }]}
          pointerEvents="none"
        />

        {/* Logo circle with crescent + star */}
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: logoOpacity, transform: [{ scale: logoScale }, { scale: pulseAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F7FBF7']}
            style={styles.logoCircle}
          >
            {/* Islamic geometric decoration – top arc dots */}
            <View style={styles.topDotsRow}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.topDot, i === 2 && styles.topDotCenter]} />
              ))}
            </View>

            {/* Crescent + star */}
            <View style={styles.crescentWrap}>
              <Text style={styles.crescentChar}>☽</Text>
              <Text style={styles.starChar}>✦</Text>
            </View>

            {/* Bottom arc dots */}
            <View style={styles.bottomDotsRow}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.topDot, i === 2 && styles.topDotCenter]} />
              ))}
            </View>
          </LinearGradient>

          {/* Shadow ring below logo */}
          <View style={styles.logoShadow} />
        </Animated.View>

        {/* Bismillah Arabic text */}
        <Animated.Text style={[styles.bismillah, { opacity: bismillahOpacity }]}>
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </Animated.Text>

        {/* Divider ornament */}
        <Animated.View style={[styles.divider, { transform: [{ scaleX: dividerScale }] }]}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDiamond} />
          <View style={styles.dividerLine} />
        </Animated.View>

        {/* App name */}
        <Animated.Text
          style={[
            styles.title,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
          ]}
        >
          Quran Companion
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Find peace through His words
        </Animated.Text>
      </View>

      {/* ── Bottom ornament ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.bottomOrnament, { opacity: taglineOpacity }]}>
        <View style={styles.ornamentDot} />
        <View style={[styles.ornamentDot, styles.ornamentDotLarge]} />
        <View style={styles.ornamentDot} />
      </Animated.View>

      {/* Footer ayah */}
      <Animated.Text style={[styles.footerAyah, { opacity: taglineOpacity }]}>
        "Verily, in the remembrance of Allah do hearts find rest." — 13:28
      </Animated.Text>
    </View>
  );
};

const LOGO_SIZE = 200;
const RING_OUTER = LOGO_SIZE + 100;
const RING_MID   = LOGO_SIZE + 60;
const RING_INNER = LOGO_SIZE + 22;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Background decorations ─────────────────────────────────────────────────
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.35,
  },
  blobTopRight: {
    width: 280,
    height: 280,
    backgroundColor: '#C8E6C9',
    top: -60,
    right: -80,
  },
  blobBottomLeft: {
    width: 220,
    height: 220,
    backgroundColor: '#DCEDC8',
    bottom: 80,
    left: -70,
  },

  // ── Center group ───────────────────────────────────────────────────────────
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Rings ──────────────────────────────────────────────────────────────────
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  ringOuter: {
    width: RING_OUTER,
    height: RING_OUTER,
    borderColor: '#A5D6A7',
  },
  ringMid: {
    width: RING_MID,
    height: RING_MID,
    borderColor: '#81C784',
    borderWidth: 1,
  },
  ringInner: {
    width: RING_INNER,
    height: RING_INNER,
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderStyle: 'dashed',
  },

  // ── Logo circle ─────────────────────────────────────────────────────────────
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  logoShadow: {
    position: 'absolute',
    bottom: -14,
    width: LOGO_SIZE * 0.65,
    height: 18,
    borderRadius: 50,
    backgroundColor: 'rgba(46,125,50,0.12)',
  },
  topDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  bottomDotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  topDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#A5D6A7',
  },
  topDotCenter: {
    width: 7,
    height: 7,
    backgroundColor: '#4CAF50',
  },
  crescentWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  crescentChar: {
    fontSize: 72,
    color: '#2E7D32',
    lineHeight: 80,
    letterSpacing: -2,
  },
  starChar: {
    fontSize: 22,
    color: '#D4AF37',
    marginTop: 6,
    marginLeft: -6,
  },

  // ── Text ───────────────────────────────────────────────────────────────────
  bismillah: {
    fontSize: 20,
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#C8E6C9',
    width: 70,
  },
  dividerDiamond: {
    width: 8,
    height: 8,
    backgroundColor: '#4CAF50',
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B3A1C',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#5A7A5C',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontWeight: '400',
  },

  // ── Bottom ─────────────────────────────────────────────────────────────────
  bottomOrnament: {
    position: 'absolute',
    bottom: 90,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ornamentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A5D6A7',
  },
  ornamentDotLarge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  footerAyah: {
    position: 'absolute',
    bottom: 44,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
