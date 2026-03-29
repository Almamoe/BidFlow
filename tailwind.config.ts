import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EDFDF6",
          100: "#D0F9E8",
          200: "#A3F2D2",
          300: "#6DE4B6",
          400: "#38CC95",
          500: "#16A974",
          600: "#0F6E56",
          700: "#0D5A47",
          800: "#0A4737",
          900: "#07332A",
          950: "#031F19",
        },
        gold: {
          50: "#FDF8EC",
          100: "#FAECC9",
          200: "#F5D78E",
          300: "#EFC053",
          400: "#D4A843",
          500: "#B8882A",
          600: "#976B1E",
          700: "#6F4E18",
          800: "#4A3412",
          900: "#2E200B",
        },
        charcoal: {
          50: "#F5F5F4",
          100: "#E8E7E5",
          200: "#D1CFCC",
          300: "#A9A7A2",
          400: "#7C7A76",
          500: "#5C5A56",
          600: "#434240",
          700: "#2E2D2B",
          800: "#1C1B1A",
          900: "#111110",
          950: "#0A0A09",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        display: ['"DM Serif Display"', "Georgia", "serif"],
        mono: ['"DM Mono"', "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "count-up": "countUp 0.6s ease-out",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "bid-pop": "bidPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "orb-drift": "orbDrift 30s ease-in-out infinite",
        "orb-drift-alt": "orbDriftAlt 24s ease-in-out infinite",
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
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        bidPop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        orbDrift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(40px, -60px)" },
          "50%": { transform: "translate(-30px, 40px)" },
          "75%": { transform: "translate(20px, -20px)" },
        },
        orbDriftAlt: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(-50px, 30px)" },
          "66%": { transform: "translate(30px, -50px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
