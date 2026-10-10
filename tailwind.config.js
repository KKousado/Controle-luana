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
        ios: {
          bg: {
            light: '#F2F2F7',
            cardLight: '#FFFFFF',
            dark: '#000000',
            cardDark: '#1C1C1E',
            cardDarkSecondary: '#2C2C2E',
          },
          green: '#34C759',
          red: '#FF3B30',
          blue: '#007AFF',
          orange: '#FF9500',
          yellow: '#FFCC00',
          purple: '#AF52DE',
          teal: '#30B0C7',
          pink: '#FF2D55',
          brown: '#A2845E',
          caramel: '#C67D34',
          gray: {
            1: '#8E8E93',
            2: '#AEAEB2',
            3: '#C7C7CC',
            4: '#D1D1D6',
            5: '#E5E5EA',
            6: '#F2F2F7',
          }
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif'
        ],
      },
      borderRadius: {
        'ios': '16px',
        'ios-lg': '20px',
        'ios-sm': '12px',
      },
      boxShadow: {
        'ios': '0 2px 12px rgba(0, 0, 0, 0.05)',
        'ios-hover': '0 6px 20px rgba(0, 0, 0, 0.08)',
        'ios-sheet': '0 -4px 24px rgba(0, 0, 0, 0.12)',
      }
    },
  },
  plugins: [],
}
