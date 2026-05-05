import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
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
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  const isPlaying = status.playing ?? false;
  const isLoading = status.isBuffering ?? false;
  const hasError = (status as any).error != null;
  const position = (status.currentTime ?? 0) * 1000; // seconds → ms
  const duration = (status.duration ?? 0) * 1000;    // seconds → ms

  // Update progress bar animation
  useEffect(() => {
    if (duration > 0) {
      progressAnim.setValue(position / duration);
    }
  }, [position, duration]);

  // Set audio mode on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      shouldPlayInBackground: false,
      interruptionModeAndroid: 'duckOthers',
    });
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      // If track finished, seek back to start then play
      if (status.didJustFinish || (duration > 0 && position >= duration - 500)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleSeek = (x: number) => {
    if (!duration || !barWidth) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth));
    player.seekTo(ratio * (duration / 1000)); // seekTo takes seconds
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container}>
      {/* Play / Pause button */}
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
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

        {/* Progress bar */}
        <TouchableOpacity
          activeOpacity={1}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          onPress={(e) => handleSeek(e.nativeEvent.locationX)}
          style={styles.progressTrack}
        >
          <View style={styles.progressBg} />
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          <View
            style={[
              styles.progressThumb,
              { left: `${progressPercent}%` },
            ]}
          />
        </TouchableOpacity>

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
  reciterName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
});
