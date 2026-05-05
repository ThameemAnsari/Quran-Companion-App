# 📖 Quran Companion App

A beautifully designed React Native (Expo) app that helps users build a consistent, meaningful relationship with the Quran — every day, beyond Ramadan.

---

## ✨ Features

### 🏠 Home — Mood-Based Discovery
- App icon displayed prominently at the top
- Select your current emotional state: Stressed, Sad, Angry, Confused, Grateful, Hopeful, or Need Motivation
- Receive curated Ayahs from the Quran matched to your mood
- Bismillah header in Arabic script
- Powered by the [Quran.com API](https://api.quran.com/api/v4/)

### 📿 For You — Ayah Reader
- Arabic text with full Uthmani script
- Translation in 50+ languages (user-selected)
- Audio recitation by Mishary Alafasy (streaming MP3)
- Bookmark any Ayah with one tap
- Write a personal reflection on any Ayah
- Add Ayahs to custom collections
- Next Ayah button scrolls back to top automatically
- **Tafsir** — deep explanations powered by Quran Foundation API (language-aware)
- **Word by Word translation** — tap any word to hear its pronunciation and see Arabic, transliteration & English meaning

### 🔤 Word by Word Translation
- Expandable card on every Ayah screen
- Each Arabic word shown as a chip: Arabic script → transliteration → English meaning
- Words flow **right-to-left**, matching the natural Quran reading order
- **Tap any word to hear its pronunciation** (audio from audio.qurancdn.com)
- Active word highlights in green while playing; auto-resets when audio finishes
- Lazy-loaded on first expand — no unnecessary API calls
- Powered by `api.quran.com/api/v4/verses/by_key?words=true`

### 🌍 Multi-Language Translation
- Choose from **50+ languages** in Profile settings
- Translation persisted across sessions via AsyncStorage
- Tafsir automatically selects the best available resource for the chosen language
- Word-by-word pronunciation always available (English meanings only)

### 🔖 Bookmarks
- Save favourite Ayahs for later
- Collapsible card layout — tap to expand
- Expanded view shows Arabic text, translation, and audio player
- Remove bookmarks directly from the expanded card
- Personal reflections tab — expandable with full Arabic, translation, lesson & application
- All data persisted locally via AsyncStorage

### 📚 Collections
- Create named collections to organise Ayahs by theme or topic
- View all collections in a card list
- Add any Ayah to one or more collections via a bottom sheet
- Collection detail screen with collapsible Ayah cards
- Reflect on or remove Ayahs from within a collection
- Create new collections on the fly from the Add to Collection sheet

### ✍️ Reflections
- Write structured reflections on any Ayah:
  - **"What did you learn from this ayah?"**
  - **"How does this apply to your life?"**
- Reflections stored locally and visible in the Progress and Bookmark tabs
- Expandable reflection cards showing the full Ayah (Arabic + translation) alongside your notes

### 📊 Progress
- **Daily streak tracker** with 🔥 fire indicator
- **Week calendar** with colour-coded day status:
  - 🟢 Green — completed (ayahs read)
  - 🟡 Yellow — partial (opened app, no ayahs read)
  - ⚪ Grey — missed
- **Weekly completion bar** — "X/7 days completed this week"
- **Filter tabs** — This Week / This Month / All Time
- **Stats cards** — Ayahs Read, Reflections, Bookmarks (tappable), Time Spent
- **History Timeline** — per-day breakdown with colour-coded chips
- **Achievement badges** — First Day, 3-Day Streak, 7-Day Streak, 30-Day Streak
- **Journey progress bar** — 30-day milestone tracker
- Tappable stats cards open modal popups with full collapsible lists of bookmarks and reflections

### 🔔 Notifications
- **Smart daily reminder** scheduled at 8:30 PM every day — fires even when the app is fully closed
- **Priority-based engine** — at most 1 notification per day, chosen in this order:
  1. **Comeback** — inactive 2–3 days, sent once then paused for 2 days
  2. **Streak warning** — fires only on `inactiveDays === 1` (last chance to save the streak before midnight)
  3. **Emotion-based** — personalised message based on last selected mood
  4. **Night reminder** — fallback within the 8:30–10:00 PM window
- **Quiet hours** respected: no notifications between 10:00 PM and 5:30 AM
- **Android HIGH importance** channel (`quran-companion`) — ensures heads-up banners appear on lock screen
- **App lifecycle aware**: scheduled reminder is cancelled when app is opened (user is active), re-scheduled when app goes to background
- Permission request modal with graceful fallback
- Configurable via Profile settings (toggle Daily Reminders on/off)

### 👤 Profile
- App icon displayed as avatar
- Personal stats: Streak, Bookmarks, Reflections, Time Spent
- Settings rows: Daily Reminders, Translation Language (static display), Reciter, Share App, About

### 🎬 Onboarding (5 slides)
1. **Mood-Based Discovery** — select your feeling, get a matching Ayah
2. **Read in your language** — 50+ translation languages
3. **Word by Word** — tap each word to explore meaning and pronunciation
4. **Reflect & Personalise** — bookmarks, collections, reflections
5. **Stay Consistent** — streak tracker and daily reminders

### 🎨 UI / UX
- Consistent collapsible card pattern across all list screens
- Custom animated splash screen
- Loading screen with floating app icon while ayahs are fetched
- Clean green-and-white colour palette throughout
- Fully TypeScript typed codebase

---

## 🛠 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React Native | 0.81.5 | Core framework |
| Expo SDK | 54 | Build tooling & native APIs |
| TypeScript | 5.x | Type safety |
| Zustand | 4.x | State management |
| AsyncStorage | 2.x | Persistent local storage |
| React Navigation | 6.x | Stack + bottom tab navigation |
| expo-audio | ~0.4.x | Audio playback (verse + word-by-word) |
| expo-notifications | ~0.29.x | Push / local notifications |
| expo-device | ~7.x | Device detection |
| NativeWind | 4.x | Tailwind-style utility classes |
| axios | 1.x | HTTP client |
| @expo/vector-icons | 14.x | Ionicons icon set |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Android Studio / emulator **or** a physical Android device
- npm

### Run in development

```bash
# Clone the repo
git clone https://github.com/ThameemAnsari/Quran-Companion-App.git
cd Quran-Companion-App

# Install dependencies
npm install

# Run on Android (builds a dev client)
npx expo run:android
```

### Build a standalone APK (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build APK (sideloadable on any Android device)
eas build -p android --profile preview
```

Download the `.apk` link printed at the end, transfer to your device, and install. No Play Store required.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── AddToCollectionSheet.tsx   # Bottom sheet for adding ayahs to collections
│   ├── AudioPlayer.tsx            # Streaming audio player
│   ├── AyahCard.tsx               # Reusable ayah card
│   ├── MoodCard.tsx               # Mood selector card
│   ├── NotificationPermissionModal.tsx
│   └── TafsirModal.tsx            # Full-page tafsir viewer (language-aware)
├── navigation/
│   └── AppNavigator.tsx           # Stack + bottom tabs
├── screens/
│   ├── SplashScreen.tsx           # Animated splash
│   ├── OnboardingScreen.tsx       # 5-slide onboarding flow
│   ├── HomeScreen.tsx             # Mood selector
│   ├── LoadingScreen.tsx          # Ayah fetching screen
│   ├── AyahScreen.tsx             # Core ayah reader (tafsir + word by word)
│   ├── BookmarkScreen.tsx         # Saved ayahs & reflections
│   ├── CollectionsScreen.tsx      # All collections
│   ├── CollectionDetailScreen.tsx # Ayahs inside a collection
│   ├── CreateCollectionScreen.tsx # New collection form
│   ├── ReflectionScreen.tsx       # Write a reflection
│   ├── ProgressScreen.tsx         # Streak, stats, history
│   └── ProfileScreen.tsx          # User profile & settings
├── services/
│   ├── aiService.ts               # Explanation generation (on-device pool)
│   ├── notificationService.ts     # Smart notification engine (priority-based, lifecycle-aware)
│   └── quranApi.ts                # Quran.com API + word-by-word + tafsir + audio
├── store/
│   └── useAppStore.ts             # Zustand global store
└── types/
    └── index.ts                   # TypeScript types
assets/
├── app_icon.png                   # App icon (all platforms)
└── splash.png                     # Splash screen image
eas.json                           # EAS Build profiles (preview APK / production AAB)
```

---

## 🌐 APIs Used

| API | Auth | Purpose |
|---|---|---|
| [api.quran.com/api/v4](https://api.quran.com/api/v4/) | None | Verse text, translations, word-by-word data |
| [cdn.islamic.network](https://cdn.islamic.network/quran/audio/128/ar.alafasy) | None | Full verse audio (Mishary Alafasy) |
| [audio.qurancdn.com](https://audio.qurancdn.com) | None | Word-by-word pronunciation audio |
| [apis.quran.foundation](https://apis.quran.foundation/content/api/v4) | OAuth2 `content` | Tafsir (Ibn Kathir + language-native) |
| [apis.quran.foundation/search](https://apis.quran.foundation/search/v1) | OAuth2 `search` | Mood-based ayah search |

---

## 🤲 About

> *"Indeed, this Quran guides to that which is most suitable."* — Al-Isra 17:9

Built with the intention of making the Quran an accessible daily companion, not just a Ramadan tradition.

