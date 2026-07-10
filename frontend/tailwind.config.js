/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14161A',
        paper: '#FAFAFA',
        line: '#E4E4E7',
        accent: '#4F46E5',   // primary actions only
        warn: '#DC2626',     // reserved exclusively for mistake/failure signals from Marketing Memory
        good: '#15803D',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
