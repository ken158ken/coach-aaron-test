import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-color-mode="dark"]'],
  theme: {
    extend: {
      colors: {
        // ABYSS Theme (深海)
        abyss: {
          black: "#000205",
          cyan: "#00ffff",
          purple: "#7b00ff",
          glass: "rgba(0, 5, 10, 0.6)",
          text: "#e0f7fa",
          "text-dim": "#80deea",
        },
        // PRISM Theme (水晶)
        prism: {
          void: "#0b001a",
          purple: "#b388ff",
          blue: "#82b1ff",
          glass: "rgba(255, 255, 255, 0.05)",
          text: "#ffffff",
          "text-dim": "#aaaaaa",
        },
        // LUXE Theme (高端)
        luxe: {
          black: "#0a0a0a",
          gold: "#d4af37",
          "gold-dim": "#8a7020",
          text: "#e0e0e0",
          "text-dim": "#888888",
          // 亮色模式額外顏色
          bg: "var(--luxe-bg)",
          surface: "var(--luxe-surface)",
          muted: "var(--luxe-muted)",
        },
      },
      fontFamily: {
        // 高端主題字體
        display: ["Playfair Display", "serif"],
        body: ["Lato", "sans-serif"],
        // 深海主題字體
        "abyss-title": ["Aboreto", "cursive"],
        "abyss-body": ["Montserrat", "sans-serif"],
        // 水晶主題字體
        "prism-title": ["Cinzel", "serif"],
        "prism-body": ["Raleway", "sans-serif"],
      },
      animation: {
        "fade-up": "fadeUp 1s ease forwards",
        drift: "drift 20s linear infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drift: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100px" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 255, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 255, 255, 0.6)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        abyss: {
          primary: "#00ffff",
          secondary: "#7b00ff",
          accent: "#00ffff",
          neutral: "#000205",
          "base-100": "#000205",
          "base-200": "#050a14",
          "base-300": "#0a1428",
          info: "#00ffff",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
        prism: {
          primary: "#b388ff",
          secondary: "#82b1ff",
          accent: "#b388ff",
          neutral: "#0b001a",
          "base-100": "#0b001a",
          "base-200": "#150030",
          "base-300": "#200050",
          info: "#82b1ff",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
        luxe: {
          primary: "#d4af37",
          secondary: "#8a7020",
          accent: "#d4af37",
          neutral: "#0a0a0a",
          "base-100": "#0a0a0a",
          "base-200": "#141414",
          "base-300": "#1e1e1e",
          info: "#d4af37",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
          "--luxe-bg": "#0a0a0a",
          "--luxe-surface": "#141414",
          "--luxe-muted": "#888888",
        },
        // 亮色主題
        "luxe-light": {
          primary: "#b8962b",
          secondary: "#6a5515",
          accent: "#b8962b",
          neutral: "#f5f5f5",
          "base-100": "#ffffff",
          "base-200": "#f8f8f8",
          "base-300": "#eeeeee",
          info: "#b8962b",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
          "--luxe-bg": "#ffffff",
          "--luxe-surface": "#f8f8f8",
          "--luxe-muted": "#666666",
        },
        "abyss-light": {
          primary: "#00b3b3",
          secondary: "#5500cc",
          accent: "#00b3b3",
          neutral: "#f0f9fa",
          "base-100": "#ffffff",
          "base-200": "#e8f5f7",
          "base-300": "#d0ebef",
          info: "#00b3b3",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
        "prism-light": {
          primary: "#7c4dff",
          secondary: "#448aff",
          accent: "#7c4dff",
          neutral: "#f5f0ff",
          "base-100": "#ffffff",
          "base-200": "#f8f5ff",
          "base-300": "#efe8ff",
          info: "#448aff",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
    ],
  },
};

export default config;
