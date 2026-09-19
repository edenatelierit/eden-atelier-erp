import type { Config } from "tailwindcss";

const timber = {
  50: "#F8F1E8",
  100: "#EFE2D0",
  200: "#E0C49E",
  300: "#C9A06C",
  400: "#B07D45",
  500: "#9A6633",
  600: "#8B5A2B",
  700: "#6F4520",
  800: "#4E3016",
  900: "#2F1C0C",
  DEFAULT: "#8B5A2B",
  foreground: "#FFF8F0",
};

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        timber,
        stone: {
          canvas: "#F4F4F5",
          raised: "#FAFAFA",
          line: "#E2E8F0",
          muted: "#64748B",
          ink: "#1E293B",
          deep: "#0F172A",
        },
      },
    },
  },
};

export default config;
