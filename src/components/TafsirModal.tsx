import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchTafsir, getTafsirForLanguage, type TafsirResult } from '../services/quranApi';
import { useAppStore } from '../store/useAppStore';

interface Props {
  visible: boolean;
  verseKey: string;
  surahName: string;
  onClose: () => void;
}

/** Strip HTML tags and collapse whitespace, preserving paragraph breaks. */
function htmlToPlain(html: string): string {
  return html
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n')   // headings → bold-ish with newlines
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')                                    // strip remaining tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')                                 // max 2 consecutive newlines
    .trim();
}

/** Split plain text into paragraphs for rendering. */
function toParagraphs(text: string): string[] {
  return text.split('\n\n').map((p) => p.trim()).filter(Boolean);
}

export const TafsirModal: React.FC<Props> = ({ visible, verseKey, surahName, onClose }) => {
  const { selectedTranslationName } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [tafsir, setTafsir] = useState<TafsirResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!visible || !verseKey) return;
    setLoading(true);
    setError(false);
    setTafsir(null);

    fetchTafsir(verseKey, selectedTranslationName).then((result) => {
      if (result) setTafsir(result);
      else setError(true);
    }).finally(() => setLoading(false));
  }, [visible, verseKey, selectedTranslationName]);

  const paragraphs = tafsir ? toParagraphs(htmlToPlain(tafsir.text)) : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="book-outline" size={20} color="#2E7D32" />
            <View>
              <Text style={styles.headerTitle}>Tafsir</Text>
              <Text style={styles.headerSub}>{surahName} · {verseKey}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Source badge */}
        {tafsir && (
          <View style={styles.sourceBadge}>
            <Ionicons name="library-outline" size={13} color="#2E7D32" />
            <Text style={styles.sourceText}>{tafsir.resourceName}</Text>
            {!tafsir.isNative && (
              <View style={styles.fallbackBadge}>
                <Text style={styles.fallbackText}>English only</Text>
              </View>
            )}
          </View>
        )}

        {/* Body */}
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#2E7D32" />
              <Text style={styles.loadingText}>Loading tafsir…</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.centered}>
              <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
              <Text style={styles.errorTitle}>Tafsir unavailable</Text>
              <Text style={styles.errorText}>
                Could not load tafsir for this ayah. Please check your connection and try again.
              </Text>
            </View>
          )}

          {!loading && !error && paragraphs.map((para, i) => (
            <Text key={i} style={styles.paragraph}>{para}</Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sourceText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  fallbackBadge: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  fallbackText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 26,
    color: '#374151',
  },
  centered: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#9CA3AF',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
