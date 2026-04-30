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
- English translation (Sahih International)
- Audio recitation by Mishary Alafasy (streaming MP3)
- Contextual AI-generated explanation for each Ayah
- Bookmark any Ayah with one tap
- Write a personal reflection on any Ayah
- Add Ayahs to custom collections
- Next Ayah button scrolls back to top automatically

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
- Daily reminder notifications to keep your streak alive
- Permission request modal with graceful fallback
- Configurable via Profile settings

### 👤 Profile
- App icon displayed as avatar
- Personal stats: Streak, Bookmarks, Reflections, Time Spent
- Settings rows: Daily Reminders, Translation Language, Reciter, Dark Mode (coming soon)

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
| React Native | 0.74.5 | Core framework |
| Expo SDK | 51 | Build tooling & native APIs |
| TypeScript | 5.x | Type safety |
| Zustand | 4.5.4 | State management |
| AsyncStorage | 1.23.1 | Persistent local storage |
| React Navigation | 6.x | Stack + bottom tab navigation |
| expo-av | ~14.0.7 | Audio playback |
| expo-notifications | ~0.28.19 | Push / local notifications |
| expo-device | ~6.0.2 | Device detection |
| expo-linear-gradient | ~13.0.2 | Gradient UI elements |
| NativeWind | 4.x | Tailwind-style utility classes |
| axios | 1.7.2 | HTTP client |
| @expo/vector-icons | 14.x | Ionicons icon set |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on iOS/Android **or** a physical device for APK testing
- npm or yarn
- (For APK builds) An [Expo account](https://expo.dev) + EAS CLI

### Run in development

```bash
# Clone the repo
git clone https://github.com/ThameemAnsari/Quran-Companion-App.git
cd Quran-Companion-App

# Install dependencies
npm install

# Start the dev server
npx expo start --clear
```

Scan the QR code with **Expo Go** on your device.

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
│   └── NotificationPermissionModal.tsx
├── navigation/
│   └── AppNavigator.tsx           # Stack + bottom tabs
├── screens/
│   ├── SplashScreen.tsx           # Animated splash
│   ├── HomeScreen.tsx             # Mood selector
│   ├── LoadingScreen.tsx          # Ayah fetching screen
│   ├── AyahScreen.tsx             # Core ayah reader
│   ├── BookmarkScreen.tsx         # Saved ayahs & reflections
│   ├── CollectionsScreen.tsx      # All collections
│   ├── CollectionDetailScreen.tsx # Ayahs inside a collection
│   ├── CreateCollectionScreen.tsx # New collection form
│   ├── ReflectionScreen.tsx       # Write a reflection
│   ├── ProgressScreen.tsx         # Streak, stats, history
│   └── ProfileScreen.tsx          # User profile & settings
├── services/
│   ├── aiService.ts               # AI explanation generation
│   ├── notificationService.ts     # Notification scheduling
│   └── quranApi.ts                # Quran.com API + audio URL builder
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

- **Quran Text & Translation**: [api.quran.com/api/v4](https://api.quran.com/api/v4/) — free, no auth required
- **Audio Recitation**: [verses.quran.com](https://verses.quran.com) — Mishary Alafasy 128 kbps MP3

---

## 🤲 About

> *"Indeed, this Quran guides to that which is most suitable."* — Al-Isra 17:9

Built with the intention of making the Quran an accessible daily companion, not just a Ramadan tradition.

