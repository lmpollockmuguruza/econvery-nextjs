import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#FAFAF8",
          100: "#f0f0ed",
          200: "#e0e0de",
          300: "#d0d0cd",
          400: "#aaa",
          500: "#777",
          600: "#3d3d3d",
          700: "#1a1a1a",
        },
        burgundy: {
          DEFAULT: "#6b2737",
          soft: "#8b3747",
          muted: "#9e5060",
          wash: "rgba(107, 39, 55, 0.06)",
          border: "rgba(107, 39, 55, 0.18)",
        },
        cream: {
          DEFAULT: "#f5efe5",
          strong: "#ede5d8",
        },
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#3d3d3d",
          muted: "#777",
          faint: "#aaa",
          ghost: "#ccc",
        },
        score: {
          high: "#2d6a4f",
          medium: "#8b6914",
          low: "#aaa",
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        serif: ['"Source Serif 4"', "Georgia", "serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      fontSize: {
        "display-lg": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.025em" }],
        "display": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        "display-sm": ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease forwards",
        "slide-in": "fadeSlideIn 0.3s ease forwards",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeSlideIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
