import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2A4A",
          light: "#284070",
          dark: "#121D33",
        },
        gold: {
          DEFAULT: "#B8892B",
          light: "#D4AD5C",
          dark: "#8F6A1F",
        },
        parchment: "#FAF7F0",
        ink: "#22262F",
        line: "#E4E0D4",
      },
      fontFamily: {
        display: ["var(--font-source-serif)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
