import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { AudioPlayer } from '../components/AudioPlayer';
import { buildAudioUrl } from '../services/quranApi';
import type { Ayah, WeekStats } from '../types';

// ─── Reflection card ─────────────────────────────────────────────────────────
function ReflectionCard({ item }: { item: import('../types').Reflection }) {
  const [open, setOpen] = useState(false);
  const date = new Date(item.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return (
    <View style={styles.detailCard}>
      <TouchableOpacity
        style={styles.bookmarkRow}
        activeOpacity={0.75}
        onPress={() => setOpen((v) => !v)}
      >
        <View style={[styles.bookmarkIcon, { backgroundColor: '#F5F3FF' }]}>
          <Text style={{ fontSize: 22 }}>✍️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailVerse}>{item.ayah.surahName} · {item.ayah.verseKey}</Text>
          <Text style={styles.cardPreviewText} numberOfLines={1}>
            {item.lesson || item.application || 'Reflection saved'}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#D1D5DB" />
      </TouchableOpacity>
      {open && (
        <View style={styles.bookmarkExpanded}>
          <View style={styles.detailDivider} />
          {/* Ayah Arabic + Translation */}
          <Text style={styles.arabicSnippet}>{item.ayah.arabicText}</Text>
          <View style={styles.detailDivider} />
          <Text style={styles.detailText}>{item.ayah.translation}</Text>
          <View style={styles.detailDivider} />
          {/* Reflection notes */}
          {!!item.lesson && (
            <>
              <Text style={styles.reflectionLabel}>What did you learn from this ayah?</Text>
              <Text style={styles.detailText}>{item.lesson}</Text>
            </>
          )}
          {!!item.application && (
            <>
              <Text style={[styles.reflectionLabel, { marginTop: 10 }]}>How does this apply to your life?</Text>
              <Text style={styles.detailApplication}>{item.application}</Text>
            </>
          )}
          <Text style={styles.detailDate}>{date}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Bookmark card (needs own component to use useState) ──────────────────────
function BookmarkCard({ item, onRemove }: { item: Ayah; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.detailCard}>
      <TouchableOpacity
        style={styles.bookmarkRow}
        activeOpacity={0.75}
        onPress={() => setOpen((v) => !v)}
      >
        <View style={styles.bookmarkIcon}>
          <Text style={{ fontSize: 22 }}>📖</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.detailVerse}>{item.surahName} · {item.verseKey}</Text>
          <Text style={styles.cardPreviewText} numberOfLines={1}>{item.translation}</Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#D1D5DB" />
      </TouchableOpacity>
      {open && (
        <View style={styles.bookmarkExpanded}>
          <View style={styles.detailDivider} />
          <Text style={styles.arabicSnippet}>{item.arabicText}</Text>
          <View style={styles.detailDivider} />
          <Text style={styles.detailText}>{item.translation}</Text>
          <View style={{ marginTop: 14 }}>
            <AudioPlayer audioUrl={item.audioUrl || buildAudioUrl(item.surahNumber, item.verseNumber)} />
          </View>
          <TouchableOpacity style={styles.bookmarkDeleteBtn} onPress={onRemove}>
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={styles.bookmarkDeleteText}>Remove Bookmark</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Filter = 'week' | 'month' | 'alltime';
type StatKey = 'ayahsRead' | 'reflections' | 'bookmarks' | 'timeSpentMinutes';
type DayStatus = 'completed' | 'partial' | 'missed';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const EMPTY_STATS: WeekStats = { ayahsRead: 0, reflections: 0, bookmarks: 0, timeSpentMinutes: 0 };

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}

function sumStats(entries: WeekStats[]): WeekStats {
  return entries.reduce(
    (acc, s) => ({
      ayahsRead: acc.ayahsRead + s.ayahsRead,
      reflections: acc.reflections + s.reflections,
      bookmarks: acc.bookmarks + s.bookmarks,
      timeSpentMinutes: acc.timeSpentMinutes + s.timeSpentMinutes,
    }),
    { ...EMPTY_STATS }
  );
}

function getDayStatus(stats?: WeekStats): DayStatus {
  if (!stats) return 'missed';
  if (stats.ayahsRead > 0) return 'completed';
  if (stats.timeSpentMinutes > 0) return 'partial';
  return 'missed';
}

function formatDisplayDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const ydDate = new Date();
  ydDate.setUTCDate(ydDate.getUTCDate() - 1);
  const yesterday = ydDate.toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}


// ─── Component ────────────────────────────────────────────────────────────────
export const ProgressScreen: React.FC = () => {
  const { streak, dailyStats, reflections, bookmarks, removeBookmark } = useAppStore();
  const [filter, setFilter] = useState<Filter>('week');
  const [expandedStat, setExpandedStat] = useState<StatKey | null>(null);

  const todayStr = isoDate(new Date());

  // ── Date arrays per filter ────────────────────────────────────────
  const weekDates = useMemo<string[]>(() => {
    const base = new Date(todayStr + 'T00:00:00Z');
    const dow = base.getUTCDay(); // 0=Sun … 6=Sat, UTC-consistent
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setUTCDate(base.getUTCDate() - dow + i);
      return d.toISOString().split('T')[0];
    });
  }, [todayStr]);

  const monthDates = useMemo<string[]>(() => {
    const base = new Date(todayStr + 'T00:00:00Z');
    const firstDay = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
    const days: string[] = [];
    const cur = new Date(firstDay);
    while (cur.toISOString().split('T')[0] <= todayStr) {
      days.push(cur.toISOString().split('T')[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return days;
  }, [todayStr]);

  const allDates = useMemo<string[]>(
    () => Object.keys(dailyStats).sort(),
    [dailyStats]
  );

  const activeDates =
    filter === 'week' ? weekDates : filter === 'month' ? monthDates : allDates;

  // ── Aggregate stats for selected filter ──────────────────────────
  const aggregateStats = useMemo(
    () => sumStats(activeDates.map((d) => dailyStats[d] ?? EMPTY_STATS)),
    [activeDates, dailyStats]
  );

  // ── Weekly completion progress bar ────────────────────────────────
  const weekCompleted = weekDates.filter((d) => (dailyStats[d]?.ayahsRead ?? 0) > 0).length;
  const weekTotal = weekDates.filter((d) => d <= todayStr).length;

  // ── History timeline: mirrors activeDates (newest first) ─────────
  const historyDays = useMemo(() =>
    [...activeDates]
      .filter((ds) => ds <= todayStr)
      .reverse()
      .map((ds) => ({ dateStr: ds, stats: dailyStats[ds], status: getDayStatus(dailyStats[ds]) })),
    [activeDates, dailyStats, todayStr]
  );

  // ── Calendar row ──────────────────────────────────────────────────
  const calendarDays = weekDates.map((ds, i) => ({
    label: DAY_LABELS[i],
    dateStr: ds,
    date: parseInt(ds.split('-')[2], 10),
    isToday: ds === todayStr,
    isFuture: ds > todayStr,
    status: getDayStatus(dailyStats[ds]),
  }));

  // ── Derived counts from source of truth ──────────────────────────
  const filteredReflections = useMemo(
    () => reflections.filter((r) => {
      if (filter === 'alltime') return true;
      const d = r.createdAt?.split('T')[0];
      return d ? activeDates.includes(d) : false;
    }),
    [reflections, filter, activeDates]
  );

  // Bookmark count: filter live bookmarks by savedAt for period accuracy.
  // Bookmarks without savedAt (legacy) count toward all periods.
  const bookmarkCount = useMemo(() => {
    if (filter === 'alltime') return bookmarks.length;
    return bookmarks.filter((b) => !b.savedAt || activeDates.includes(b.savedAt)).length;
  }, [bookmarks, filter, activeDates]);

  // ── Stat cards ────────────────────────────────────────────────────
  const statCards: { key: StatKey; icon: string; label: string; color: string; value: string | number }[] = [
    { key: 'ayahsRead', icon: 'book-outline', label: 'Ayahs Read', color: '#2E7D32', value: aggregateStats.ayahsRead },
    { key: 'reflections', icon: 'pencil-outline', label: 'Reflections', color: '#7C3AED', value: filteredReflections.length },
    { key: 'bookmarks', icon: 'bookmark-outline', label: 'Bookmarks', color: '#D97706', value: bookmarkCount },
    { key: 'timeSpentMinutes', icon: 'time-outline', label: 'Time Spent', color: '#0284C7', value: formatTime(aggregateStats.timeSpentMinutes) },
  ];

  const modalTitle =
    expandedStat === 'ayahsRead' ? 'Ayahs Read' :
    expandedStat === 'reflections' ? 'Reflections' :
    expandedStat === 'bookmarks' ? 'Bookmarks' : 'Time Spent';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F2" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Your Progress</Text>

        {/* Streak + Calendar */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <View style={styles.streakIconWrap}>
              <Text style={styles.streakEmoji}>🔥</Text>
            </View>
            <View>
              <Text style={styles.streakNumber}>{streak} Day Streak</Text>
              <Text style={styles.streakSub}>
                {streak > 0 ? "Keep it up! You're doing great!" : 'Start your streak today!'}
              </Text>
            </View>
          </View>

          <View style={styles.weekRow}>
            {calendarDays.map((d) => (
              <View key={d.dateStr} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{d.label}</Text>
                <View style={[
                  styles.dayCircle,
                  !d.isFuture && d.status === 'completed' && styles.dayCircleCompleted,
                  !d.isFuture && d.status === 'partial' && styles.dayCirclePartial,
                  d.isToday && styles.dayCircleToday,
                ]}>
                  <Text style={[styles.dayNumber, !d.isFuture && d.status === 'completed' && styles.dayNumberLight]}>
                    {d.date}
                  </Text>
                </View>
                <View style={[
                  styles.statusDot,
                  !d.isFuture && d.status === 'completed' && styles.statusDotGreen,
                  !d.isFuture && d.status === 'partial' && styles.statusDotYellow,
                ]} />
              </View>
            ))}
          </View>

          <View style={styles.legendRow}>
            {[
              { dot: styles.statusDotGreen, label: 'Completed' },
              { dot: styles.statusDotYellow, label: 'Partial' },
              { dot: undefined, label: 'Missed' },
            ].map(({ dot, label }) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendDot, dot]} />
                <Text style={styles.legendLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.weekProgressWrap}>
            <View style={styles.weekProgressBg}>
              <View style={[styles.weekProgressFill, { width: `${(weekCompleted / 7) * 100}%` }]} />
            </View>
            <Text style={styles.weekProgressLabel}>{weekCompleted}/{weekTotal} days completed this week</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(['week', 'month', 'alltime'] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stat cards */}
        <Text style={styles.sectionTitle}>
          {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
        </Text>
        <View style={styles.statsGrid}>
          {statCards.map((stat) => {
            const tappable = stat.key === 'reflections' || stat.key === 'bookmarks';
            if (tappable) {
              return (
                <TouchableOpacity
                  key={stat.key}
                  style={styles.statCard}
                  onPress={() => setExpandedStat(stat.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                </TouchableOpacity>
              );
            }
            return (
              <View key={stat.key} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* History Timeline */}
        <Text style={styles.sectionTitle}>History</Text>
        <View style={styles.timelineCard}>
          {historyDays.map(({ dateStr, stats: ds, status }, i) => (
            <View key={dateStr} style={styles.timelineRow}>
              <View style={styles.timelineDotCol}>
                <View style={[
                  styles.timelineDot,
                  status === 'completed' && styles.timelineDotGreen,
                  status === 'partial' && styles.timelineDotYellow,
                ]} />
                {i < historyDays.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{formatDisplayDate(dateStr)}</Text>
                {status === 'completed' && ds ? (
                  <View style={styles.timelineChips}>
                    <View style={[styles.timelineChip, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={[styles.timelineChipText, { color: '#2E7D32' }]}>
                        📖 {ds.ayahsRead} ayah{ds.ayahsRead !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    {ds.reflections > 0 && (
                      <View style={[styles.timelineChip, { backgroundColor: '#EDE9FE' }]}>
                        <Text style={[styles.timelineChipText, { color: '#7C3AED' }]}>
                          ✏️ {ds.reflections} reflection{ds.reflections !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {ds.bookmarks > 0 && (
                      <View style={[styles.timelineChip, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.timelineChipText, { color: '#D97706' }]}>
                          🔖 {ds.bookmarks} bookmark{ds.bookmarks !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                    {ds.timeSpentMinutes > 0 && (
                      <View style={[styles.timelineChip, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.timelineChipText, { color: '#0284C7' }]}>
                          ⏱ {formatTime(ds.timeSpentMinutes)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : status === 'partial' ? (
                  <Text style={[styles.timelineDetail, { color: '#D97706' }]}>Opened · no ayahs read</Text>
                ) : (
                  <Text style={[styles.timelineDetail, { color: '#D1D5DB' }]}>Skipped</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Journey card */}
        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <Text style={styles.journeyTitle}>Your Journey</Text>
            <Text style={styles.journeyIcon}>🌿</Text>
          </View>
          <Text style={styles.journeyText}>Consistency brings you closer to the Quran.</Text>
          <View style={styles.journeyProgress}>
            <View style={styles.journeyProgressBg}>
              <View style={[styles.journeyProgressFill, { width: `${Math.min(100, (streak / 30) * 100)}%` }]} />
            </View>
            <Text style={styles.journeyProgressLabel}>{streak}/30 days to your next milestone</Text>
          </View>
          <View style={styles.pathRow}>
            {[...Array(7)].map((_, i) => (
              <View key={i} style={[styles.pathDot, i < Math.min(7, streak) && styles.pathDotFilled]} />
            ))}
          </View>
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.badgesRow}>
          {[
            { emoji: '🌱', label: 'First Day', req: 1 },
            { emoji: '⭐', label: '3 Days', req: 3 },
            { emoji: '🔥', label: '7 Days', req: 7 },
            { emoji: '💎', label: '30 Days', req: 30 },
          ].map((badge) => {
            const earned = streak >= badge.req;
            return (
              <View key={badge.label} style={[styles.badge, !earned && styles.badgeLocked]}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{badge.label}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={expandedStat !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setExpandedStat(null)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <TouchableOpacity onPress={() => setExpandedStat(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color="#1B1B1B" />
            </TouchableOpacity>
          </View>

          {expandedStat === 'reflections' && (
            <FlatList
              data={filteredReflections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalContent}
              ListEmptyComponent={<Text style={styles.emptyModal}>No reflections for this period.</Text>}
              renderItem={({ item }) => <ReflectionCard item={item} />}
            />
          )}

          {expandedStat === 'bookmarks' && (
            <FlatList
              data={bookmarks}
              keyExtractor={(item) => item.verseKey}
              contentContainerStyle={styles.modalContent}
              ListEmptyComponent={<Text style={styles.emptyModal}>No bookmarks yet.</Text>}
              renderItem={({ item }) => <BookmarkCard item={item} onRemove={() => removeBookmark(item.verseKey)} />}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7F2' },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: '#1B1B1B', marginBottom: 16, letterSpacing: -0.3 },
  streakCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  streakIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  streakEmoji: { fontSize: 26 },
  streakNumber: { fontSize: 20, fontWeight: '700', color: '#1B1B1B' },
  streakSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayCol: { alignItems: 'center', gap: 4 },
  dayLabel: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  dayCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  dayCircleCompleted: { backgroundColor: '#2E7D32' },
  dayCirclePartial: { backgroundColor: '#FEF3C7' },
  dayCircleToday: { borderWidth: 2, borderColor: '#2E7D32' },
  dayNumber: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  dayNumberLight: { color: '#fff' },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB' },
  statusDotGreen: { backgroundColor: '#2E7D32' },
  statusDotYellow: { backgroundColor: '#D97706' },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E5E7EB' },
  legendLabel: { fontSize: 11, color: '#9CA3AF' },
  weekProgressWrap: { gap: 6 },
  weekProgressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3 },
  weekProgressFill: { height: 6, backgroundColor: '#2E7D32', borderRadius: 3 },
  weekProgressLabel: { fontSize: 12, color: '#6B7280' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterPill: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  filterPillActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1B1B1B', marginBottom: 12, letterSpacing: -0.2 },
  statsGrid: { gap: 10, marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  statIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '700' },
  timelineCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  timelineRow: { flexDirection: 'row', minHeight: 48 },
  timelineDotCol: { width: 24, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E5E7EB', marginTop: 4 },
  timelineDotGreen: { backgroundColor: '#2E7D32' },
  timelineDotYellow: { backgroundColor: '#D97706' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#F3F4F6', marginVertical: 2 },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 12 },
  timelineDate: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  timelineDetail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  timelineChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  timelineChip: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  timelineChipText: { fontSize: 12, fontWeight: '600' },
  journeyCard: { backgroundColor: '#2E7D32', borderRadius: 20, padding: 20, marginBottom: 20 },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  journeyTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  journeyIcon: { fontSize: 24 },
  journeyText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  journeyProgress: { marginBottom: 16 },
  journeyProgressBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, marginBottom: 6 },
  journeyProgressFill: { height: 6, backgroundColor: '#fff', borderRadius: 3 },
  journeyProgressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  pathRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pathDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  pathDotFilled: { backgroundColor: '#fff' },
  badgesRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 8 },
  badge: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', flex: 1, minWidth: '20%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  badgeLocked: { opacity: 0.4 },
  badgeEmoji: { fontSize: 28, marginBottom: 4 },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: '#1B1B1B', textAlign: 'center' },
  badgeLabelLocked: { color: '#9CA3AF' },
  modalSafe: { flex: 1, backgroundColor: '#F5F7F2' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  modalContent: { padding: 16, gap: 12 },
  emptyModal: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15 },
  detailCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  detailVerse: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  detailText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  detailApplication: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 18 },
  detailDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  arabicSnippet: { fontSize: 18, textAlign: 'right', color: '#1B1B1B', lineHeight: 34 },
  bookmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookmarkIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
  },
  bookmarkExpanded: { paddingTop: 4 },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bookmarkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookmarkDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  cardPreviewText: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  detailDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  dayDetailRow: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  dayDetailDate: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  dayDetailValue: { fontSize: 16, fontWeight: '700', color: '#2E7D32' },
});

