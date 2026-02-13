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
          50: "#f5f2ec",
          100: "#ede9e0",
          200: "#ddd7cb",
          300: "#c8c0b2",
          400: "#a09890",
          500: "#7a7368",
          600: "#5a554e",
          700: "#3d3833",
          800: "#2a2622",
          900: "#1a1816",
        },
        burgundy: {
          DEFAULT: "#6b2737",
          50: "#fdf2f4",
          100: "#fce7eb",
          200: "#f9d0d9",
          300: "#f4a9b9",
          400: "#ec7b94",
          500: "#de4d6f",
          600: "#c9325a",
          700: "#a82548",
          800: "#6b2737",
          900: "#4a1825",
          wash: "rgba(107, 39, 55, 0.05)",
          glow: "rgba(107, 39, 55, 0.10)",
          soft: "#8b3747",
        },
        ink: {
          DEFAULT: "#1a1816",
          soft: "#3d3833",
          muted: "#7a7368",
          faint: "#b0a99e",
          ghost: "#d4cfc8",
        },
        method: {
          bg: "#eef6fc",
          text: "#1d5c8a",
        },
        interest: {
          bg: "#f5edf8",
          text: "#6b2d7b",
        },
        score: {
          high: "#2d6a4f",
          medium: "#8b6914",
          low: "#78716c",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ['"EB Garamond"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        "display-lg": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
        "display": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-sm": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        glass: "20px",
      },
      boxShadow: {
        glass: "0 4px 24px rgba(26,24,22,0.04), 0 1px 3px rgba(26,24,22,0.03)",
        "glass-hover": "0 8px 32px rgba(107,39,55,0.07), 0 2px 8px rgba(107,39,55,0.04)",
        "glass-elevated": "0 12px 44px rgba(107,39,55,0.1), 0 4px 12px rgba(107,39,55,0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "orb-drift": "orbDrift 25s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        orbDrift: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-30px,20px) scale(1.08)" },
          "100%": { transform: "translate(15px,-15px) scale(0.95)" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
