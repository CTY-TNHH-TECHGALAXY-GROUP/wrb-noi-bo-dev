import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // 👇 Khai báo đường dẫn vào thư mục src để Tailwind biết chỗ tô màu
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ['var(--font-primary)', 'sans-serif'],
        luxury: ['var(--font-luxury)', 'serif'],
      },
      keyframes: {
        'scale-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'scale-pulse': 'scale-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;