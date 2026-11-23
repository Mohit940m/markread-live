/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: 'var(--bg-canvas)',
          light: '#F8FAFC',
          dark: '#0F1117',
        },
        surface: {
          DEFAULT: 'var(--bg-surface)',
          light: '#FFFFFF',
          dark: '#161B22',
        },
        elevated: {
          DEFAULT: 'var(--bg-elevated)',
          light: '#F1F5F9',
          dark: '#1E2530',
        },
        borderSubtle: {
          DEFAULT: 'var(--border-subtle)',
          light: '#E2E8F0',
          dark: '#2A3241',
        },
        textPrimary: {
          DEFAULT: 'var(--text-primary)',
          light: '#0F172A',
          dark: '#E2E8F0',
        },
        textMuted: {
          DEFAULT: 'var(--text-muted)',
          light: '#64748B',
          dark: '#94A3B8',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: '#0284C7',
          light: '#0284C7',
          dark: '#38BDF8',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
