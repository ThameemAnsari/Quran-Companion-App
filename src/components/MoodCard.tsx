import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import type { MoodOption } from '../types';

interface Props {
  option: MoodOption;
  onPress: () => void;
}

export const MoodCard: React.FC<Props> = ({ option, onPress }) => {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();

  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={[styles.iconBadge, { backgroundColor: option.bgColor }]}>
          <Text style={styles.emoji}>{option.emoji}</Text>
        </View>
        <Text style={[styles.label, { color: option.color }]}>
          {option.label}
        </Text>
        <View style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: -2,
  },
});
