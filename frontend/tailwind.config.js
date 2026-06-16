/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#14142B', soft: '#1F1F45', soft2: '#272755' },
        paper: '#FDF8EC',
        amber: '#FFC857',
        mint: '#6FCF97',
        coral: '#FF6B6B',
        sky: '#5DD5E8',
        cloud: { DEFAULT: '#F3F1FB', muted: '#A6A3C9', dim: '#74719B' },
        // Keep `brand` as an alias so any stray reference still resolves.
        brand: { 500: '#FFC857', 600: '#ffb02e', 700: '#e69500' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '20px', pill: '999px' },
      boxShadow: {
        amb: '0 20px 50px -20px rgba(0,0,0,0.55)',
        glow: '0 10px 24px -8px rgba(255,200,87,0.45)',
      },
    },
  },
  plugins: [],
};
