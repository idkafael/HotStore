import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          primary: "#9333EA",
          secondary: "#A855F7",
          light: "#C084FC",
          dark: "#7C3AED",
        },
        dark: {
          bg: "#000000",
          card: "#0F0F0F",
          border: "#1F1F1F",
        },
      },
    },
  },
  plugins: [],
};
export default config;
