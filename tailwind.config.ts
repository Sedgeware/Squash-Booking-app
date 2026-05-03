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
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          // 600 = Rankd primary green, 700 = Rankd hover green
          600: "#22c55e",
          700: "#16a34a",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
      },
    },
  },
  plugins: [],
};

export default config;
