import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9f6",
          100: "#d9f2e8",
          500: "#0f9d6b",
          600: "#0c7f57",
          700: "#0a6647",
        },
      },
    },
  },
  plugins: [],
};
export default config;
