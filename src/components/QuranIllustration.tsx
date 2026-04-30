import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

export const QuranIllustration: React.FC<Props> = ({ size = 'md' }) => {
  const scale = size === 'sm' ? 0.65 : size === 'lg' ? 1.35 : 1;
  const s = (n: number) => n * scale;

  const domeDia   = s(200);
  const bookW     = s(182);
  const pageW     = s(82);
  const pageH     = s(108);
  const spineW    = s(14);
  const coverH    = s(14);
  const tableW    = s(200);
  const tableH    = s(13);
  const totalH    = domeDia * 0.72 + tableH;

  return (
    <View style={{ width: domeDia, height: totalH, alignItems: 'center', justifyContent: 'flex-end' }}>

      {/* ── Circular dome backdrop ── */}
      <View style={[S.dome, { width: domeDia, height: domeDia, borderRadius: domeDia / 2, bottom: tableH - 4 }]}>
        {/* Inner lighter circle */}
        <View style={[S.domeInner, { width: domeDia * 0.65, height: domeDia * 0.65, borderRadius: domeDia }]} />
      </View>

      {/* ── Open book ── */}
      <View style={[S.bookWrap, { width: bookW, bottom: tableH - 1 }]}>

        {/* Left page */}
        <LinearGradient colors={['#FFFEF7', '#F5F9EE']} style={[S.page, S.pageLeft, { width: pageW, height: pageH }]}>
          {/* Gold border frame */}
          <View style={[S.pageFrame, { borderColor: '#C8A94A' }]}>
            {/* Text lines RTL */}
            {[88, 65, 80, 55, 75, 60, 70].map((w, i) => (
              <View key={i} style={[S.line, { width: `${w}%`, alignSelf: 'flex-end', marginBottom: s(5) }]} />
            ))}
          </View>
        </LinearGradient>

        {/* Spine */}
        <LinearGradient
          colors={['#1B5E20', '#2E7D32', '#1B5E20']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ width: spineW, height: pageH + coverH, borderRadius: s(3), zIndex: 5 }}
        />

        {/* Right page */}
        <LinearGradient colors={['#F5F9EE', '#FFFEF7']} style={[S.page, S.pageRight, { width: pageW, height: pageH }]}>
          <View style={[S.pageFrame, { borderColor: '#C8A94A' }]}>
            {[72, 88, 58, 82, 65, 78, 50].map((w, i) => (
              <View key={i} style={[S.line, { width: `${w}%`, alignSelf: 'flex-start', marginBottom: s(5) }]} />
            ))}
          </View>
        </LinearGradient>

        {/* Book cover bottom strip */}
        <LinearGradient
          colors={['#1B5E20', '#2E7D32']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[S.cover, { width: bookW, height: coverH, borderRadius: s(3) }]}
        />

        {/* Golden clasp at centre */}
        <View style={[S.clasp, { width: s(18), height: s(18), borderRadius: s(9), bottom: coverH / 2 - s(9) }]} />

        {/* Bookmark ribbon */}
        <View style={[S.ribbon, { right: pageW * 0.2, height: pageH * 0.38, width: s(9) }]} />

        {/* Shadow beneath book */}
        <View style={[S.bookShadow, { width: bookW * 0.85, height: s(10) }]} />
      </View>

      {/* ── Wooden table ── */}
      <LinearGradient
        colors={['#C8A46A', '#A0784A', '#C8A46A']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ width: tableW, height: tableH, borderRadius: tableH / 2 }}
      />
    </View>
  );
};

const S = StyleSheet.create({
  dome: {
    position: 'absolute',
    backgroundColor: '#D4EDD4',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  domeInner: {
    backgroundColor: '#EAF5EA',
    opacity: 0.9,
  },
  bookWrap: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  page: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pageLeft: {
    borderTopLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D4C07A',
    borderRightWidth: 0,
  },
  pageRight: {
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    borderColor: '#D4C07A',
    borderLeftWidth: 0,
  },
  pageFrame: {
    flex: 1,
    margin: 6,
    borderWidth: 1,
    borderRadius: 2,
    padding: 6,
    justifyContent: 'center',
  },
  line: {
    height: 3,
    backgroundColor: '#A5C8A5',
    borderRadius: 2,
    opacity: 0.85,
  },
  cover: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  clasp: {
    position: 'absolute',
    backgroundColor: '#C8A94A',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#E8C86A',
    alignSelf: 'center',
    left: '50%',
    marginLeft: -9,
  },
  ribbon: {
    position: 'absolute',
    top: 0,
    backgroundColor: '#C8362A',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    zIndex: 20,
  },
  bookShadow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
});
