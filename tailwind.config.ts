import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F2EDE7",
        card: "#FFFFFF",
        ink: "#3A3632",
        "ink-muted": "#8A817C",
        "ink-faint": "#B7AFA9",
        teal: { light: "#E7F5F3", DEFAULT: "#3BA99F", dark: "#2C8880" },
        coral: { light: "#FBECE9", DEFAULT: "#C45B4A", dark: "#A6483A" },
        forest: { light: "#E9F1EA", DEFAULT: "#4A7C59", dark: "#3B6549" },
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
    },
  },
  plugins: [],
} satisfies Config;
