import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [barWidth, setBarWidth] = useState(0);

  // Unload sound when component unmounts or URL changes
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  useEffect(() => {
    // Unload previous sound when URL changes
    const reset = async () => {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      progressAnim.setValue(0);
    };
    reset();
  }, [audioUrl]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ((status as any).error) {
        console.warn('[AudioPlayer] Playback error:', (status as any).error);
      }
      return;
    }
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis);
    if (status.durationMillis) {
      setDuration(status.durationMillis);
      const progress = status.positionMillis / status.durationMillis;
      progressAnim.setValue(progress);
    }
    if (status.didJustFinish) {
      setIsPlaying(false);
      setPosition(0);
      progressAnim.setValue(0);
    }
  }, [progressAnim]);

  const handlePlayPause = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      if (!soundRef.current) {
        setIsLoading(true);
        // Load first (shouldPlay: false), then explicitly play — avoids iOS
        // "file not found" error that occurs when shouldPlay:true races the load
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );
        soundRef.current = sound;
        setIsLoading(false);
        if (status.isLoaded) {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const status = await soundRef.current.getStatusAsync();
        if (!status.isLoaded) return;
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
        } else {
          await soundRef.current.playAsync();
        }
      }
    } catch (err: any) {
      console.warn('[AudioPlayer] error:', err?.message ?? err);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const handleSeek = async (x: number) => {
    if (!soundRef.current || !duration || !barWidth) return;
    const ratio = Math.max(0, Math.min(1, x / barWidth));
    const seekTo = ratio * duration;
    await soundRef.current.setPositionAsync(seekTo);
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
