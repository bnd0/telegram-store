/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          blue:   '#2AABEE',
          dark:   '#17212B',
          panel:  '#232E3C',
          border: '#2B3A4A',
          text:   '#F5F5F5',
          muted:  '#8B9EB0',
          accent: '#64B5F6',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
