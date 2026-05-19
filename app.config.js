// app.config.js — dynamic config so secrets are read from .env at build time.
// Expo SDK 49+ automatically loads .env into process.env before evaluating this file.
// Never commit .env; commit .env.example instead.

const USE_PRODUCTION = true; // flip to false to point at pre-live environment

const clientId = USE_PRODUCTION
  ? process.env.QURAN_PROD_CLIENT_ID
  : process.env.QURAN_PRELIVE_CLIENT_ID;

const clientSecret = USE_PRODUCTION
  ? process.env.QURAN_PROD_CLIENT_SECRET
  : process.env.QURAN_PRELIVE_CLIENT_SECRET;

export default {
  expo: {
    name: 'Qalbi',
    slug: 'quran-companion',
    scheme: 'qurancompanion',
    version: '1.1.0',
    orientation: 'portrait',
    icon: './assets/app_icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#F5F7F2',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.qurancompanion.app',
      infoPlist: {
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/app_icon.png',
        backgroundColor: '#F5F7F2',
      },
      package: 'com.qurancompanion.app',
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.USE_EXACT_ALARM',
        'android.permission.SCHEDULE_EXACT_ALARM',
        'android.permission.RECEIVE_BOOT_COMPLETED',
      ],
    },
    web: {
      favicon: './assets/app_icon.png',
    },
    plugins: [
      'expo-audio',
      [
        'expo-notifications',
        {
          icon: './assets/app_icon.png',
          color: '#4A7C59',
          androidMode: 'default',
        },
      ],
      'expo-web-browser',
      'expo-secure-store',
    ],
    extra: {
      quranApiBase: 'https://api.qurancdn.com/api/qdc/v4',
      audioBase: 'https://verses.quran.com',
      // Active credentials (switches with USE_PRODUCTION above)
      quranClientId: clientId,
      quranClientSecret: clientSecret,
      // Both environments available for quranAuth.ts
      quranProdClientId: process.env.QURAN_PROD_CLIENT_ID,
      quranProdClientSecret: process.env.QURAN_PROD_CLIENT_SECRET,
      quranPreliveClientId: process.env.QURAN_PRELIVE_CLIENT_ID,
      quranPreliveClientSecret: process.env.QURAN_PRELIVE_CLIENT_SECRET,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
  },
};
