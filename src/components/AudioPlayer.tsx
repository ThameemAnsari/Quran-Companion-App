import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  type GestureResponderEvent,
} from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  audioUrl: string;
  reciterName?: string;
}

const formatTime = (ms: number): string => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<Props> = ({
  audioUrl,
  reciterName = 'Mishary Alafasy',
}) => {
  const player = useAudioPlayer({ uri: audioUrl });
  const status = useAudioPlayerStatus(player);
  const barRef = useRef<View>(null);
  // Absolute screen position + width of the bar, populated on layout
  const barLayoutRef = useRef<{ pageX: number; width: number }>({ pageX: 0, width: 0 });
  const durationRef = useRef(0);
  // While the user is dragging, show drag position immediately; null = not dragging
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  const isPlaying = status.playing ?? false;
  const isLoading = status.isBuffering ?? false;
  const hasError = (status as any).error != null;
  const position = (status.currentTime ?? 0) * 1000; // seconds → ms
  const duration = (status.duration ?? 0) * 1000;    // seconds → ms

  // Keep durationRef in sync so PanResponder callbacks always have the latest value
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Set audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
    });
  }, []);

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  // Convert an absolute pageX touch coordinate to a 0-1 ratio along the bar
  const pageXToRatio = (pageX: number) => {
    const { pageX: barLeft, width } = barLayoutRef.current;
    if (!width) return 0;
    return clamp((pageX - barLeft) / width);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setDragRatio(pageXToRatio(e.nativeEvent.pageX));
      },
      onPanResponderMove: (e) => {
        setDragRatio(pageXToRatio(e.nativeEvent.pageX));
      },
      onPanResponderRelease: (e) => {
        const ratio = pageXToRatio(e.nativeEvent.pageX);
        const dur = durationRef.current;
        if (dur > 0) player.seekTo((ratio * dur) / 1000);
        setDragRatio(null);
      },
      onPanResponderTerminate: () => {
        setDragRatio(null);
      },
    })
  ).current;

  // Re-measure bar absolute position whenever layout changes (scroll, orientation, etc.)
  const measureBar = () => {
    barRef.current?.measure((_x, _y, width, _height, pageX) => {
      barLayoutRef.current = { pageX, width };
    });
  };

  // Display ratio: use drag position while scrubbing, otherwise real position
  const displayRatio = dragRatio !== null ? dragRatio : duration > 0 ? position / duration : 0;
  const progressPercent = displayRatio * 100;

  return (
    <View style={styles.container}>
      {/* Play / Pause button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={() => {
          if (isPlaying) {
            player.pause();
          } else {
            if (status.didJustFinish || (duration > 0 && position >= duration - 500)) {
              player.seekTo(0);
            }
            player.play();
          }
        }}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <Ionicons name="hourglass-outline" size={22} color="#fff" />
        ) : (
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={22}
            color="#fff"
          />
        )}
      </TouchableOpacity>

      {/* Progress section */}
      <View style={styles.progressSection}>
        {/* Timestamps */}
        <View style={styles.timestamps}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        {/* Progress bar — supports drag scrubbing */}
        <View
          ref={barRef}
          {...panResponder.panHandlers}
          onLayout={measureBar}
          style={styles.progressTrack}
        >
          <View style={styles.progressBg} />
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          <View
            style={[
              styles.progressThumb,
              dragRatio !== null && styles.progressThumbActive,
              { left: `${progressPercent}%` },
            ]}
          />
        </View>

        {/* Reciter name */}
        <Text style={styles.reciterName}>{reciterName} ▼</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  progressSection: {
    flex: 1,
    gap: 4,
  },
  timestamps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  progressTrack: {
    height: 20,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBg: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#2E7D32',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    marginLeft: -6,
  },
  progressThumbActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
    marginLeft: -8,
    backgroundColor: '#1B5E20',
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  reciterName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
});
