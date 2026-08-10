import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F2EDE7",
        sand: "#E9DEC9",
        card: "#FFFFFF",
        ink: "#3A3632",
        "ink-muted": "#8A817C",
        "ink-faint": "#B7AFA9",
        blue: { light: "#E8F1FB", DEFAULT: "#4A80D6", dark: "#3868AC" },
        coral: { light: "#FBECE9", DEFAULT: "#C45B4A", dark: "#A6483A" },
        forest: { light: "#E9F1EA", DEFAULT: "#4A7C59", dark: "#3B6549" },
        gold: { light: "#FBF3E1", DEFAULT: "#C99A3B", dark: "#9C7628" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(58,54,50,0.07), 0 1px 2px rgba(58,54,50,0.04)",
        card: "0 6px 24px rgba(58,54,50,0.08)",
        pop: "0 10px 30px rgba(58,54,50,0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "winner-burst": {
          "0%": { boxShadow: "0 0 0 0 rgba(74,124,89,0.55)" },
          "70%": { boxShadow: "0 0 0 16px rgba(74,124,89,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(74,124,89,0)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(540px) rotate(600deg)", opacity: "0" },
        },
      },
      animation: {
        "slide-in-right": "slide-in-right 0.28s ease-out",
        "slide-in-left": "slide-in-left 0.28s ease-out",
        "winner-burst": "winner-burst 0.5s ease-out",
        "confetti-fall": "confetti-fall 2.6s ease-in forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;
