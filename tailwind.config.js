/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,ts,tsx}", "./src/**/*.{js,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        primaryLight: "#43A047",
        lightBg: "#F5F7F2",
        card: "#FFFFFF",
        softGreen: "#E8F5E9",
        mintGreen: "#C8E6C9",
        textPrimary: "#1B1B1B",
        textSecondary: "#6B7280",
        border: "#E5E7EB",
        accentGold: "#F59E0B",
      },
      fontFamily: {
        arabic: ["Amiri", "serif"],
      },
    },
  },
  plugins: [],
};
