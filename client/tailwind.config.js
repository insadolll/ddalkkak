/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#078080',
          light: '#0D9488',
          dark: '#065F5F',
        },
        accent: {
          DEFAULT: '#F45D48',
          light: '#F97316',
        },
        surface: '#F8F5F2',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      backdropBlur: {
        xl: '16px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
