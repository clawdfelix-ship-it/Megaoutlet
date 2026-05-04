import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E74C3C',
          50: '#FDF2F1',
          100: '#FCE4E2',
          200: '#F9CEC9',
          300: '#F5A9A1',
          400: '#EF7A70',
          500: '#E74C3C',
          600: '#C0392B',
          700: '#A93226',
          800: '#8E281F',
          900: '#6B1F17',
        },
        dark: {
          DEFAULT: '#1A1A1A',
          100: '#2D2D2D',
          200: '#404040',
          300: '#525252',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Noto Sans HK', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
