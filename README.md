# 📖 Quran Companion App

A beautifully designed React Native (Expo) app that helps users build a consistent, meaningful relationship with the Quran — every day, beyond Ramadan.

---

## ✨ Features

### 🏠 Home — Mood-Based Discovery
- Select your current emotional state (Stressed, Sad, Angry, Confused, Need Motivation)
- Receive curated Ayahs from the Quran matched to your mood
- Powered by the [Quran.com API](https://api.quran.com/api/v4/)

### 📿 For You — Ayah Reader
- Arabic text with full Uthmani script
- English translation (Sahih International)
- Audio recitation by Mishary Alafasy (streaming via cdn.islamic.network)
- Contextual explanation for each Ayah
- Bookmark and reflect on any Ayah
- Swipe to next Ayah

###  Bookmarks
- Save favourite Ayahs
- View and manage your collection

### 📊 Progress
- **Daily streak tracker** with 🔥 fire indicator
- **Week calendar** with colour-coded day status:
  - 🟢 Green — completed (ayahs read)
  - 🟡 Yellow — partial (opened but no ayahs read)
  - ⚪ Grey — missed
- **Weekly completion bar** — "X/7 days completed this week"
- **Filter tabs** — This Week / This Month / All Time
- **Stats cards** — Ayahs Read, Reflections, Bookmarks (tappable), Time Spent
- **History Timeline** — per-day breakdown with colour-coded chips
- **Achievement badges** — First Day, 3 Days, 7 Days, 30 Days
- **Journey progress bar** — 30-day milestone tracker

### 👤 Profile
- Personal stats: Streak, Bookmarks, Reflections, Time Spent
- Settings: Reminders, Translation, Reciter, Dark Mode (coming soon)

---

## 🛠 Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React Native | 0.74.5 | Core framework |
| Expo SDK | 51 | Build tooling & native APIs |
| TypeScript | 5.x | Type safety |
| Zustand | 4.5.4 | State management |
| AsyncStorage | — | Persistent storage |
| React Navigation | 6.x | Stack + bottom tab navigation |
| expo-av | — | Audio playback |
| expo-linear-gradient | ~13.0.2 | Splash screen gradient |
| axios | 1.7.2 | HTTP client |
| @expo/vector-icons | — | Ionicons |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo Go app on iOS/Android
- npm or yarn

### Installation

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

---

## 📁 Project Structure

```
src/
├── components/        # AudioPlayer
├── navigation/        # AppNavigator (Stack + Tabs)
├── screens/           # All screens
│   ├── SplashScreen
│   ├── HomeScreen     # Mood selector
│   ├── LoadingScreen  # Fetches ayahs
│   ├── AyahScreen     # Core reader
│   ├── BookmarkScreen
│   ├── ProgressScreen
│   ├── ReflectionScreen
│   └── ProfileScreen
├── services/          # quranApi.ts (Quran.com API)
├── store/             # useAppStore.ts (Zustand)
└── types/             # TypeScript types
assets/                # App icon, splash screen
```

---

## 🌐 APIs Used

- **Quran Text & Translation**: [api.quran.com/api/v4](https://api.quran.com/api/v4/) — free, no auth required
- **Audio Recitation**: [cdn.islamic.network/quran/audio/128/ar.alafasy](https://cdn.islamic.network) — Mishary Alafasy 128kbps MP3

---

## 🤲 About

> *"Indeed, this Quran guides to that which is most suitable."* — Al-Isra 17:9

Built with the intention of making the Quran an accessible daily companion, not just a Ramadan tradition.

