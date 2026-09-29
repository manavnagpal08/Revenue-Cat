/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1', // Primary Indigo
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#0F172A',
        },
        surface: {
          light: '#F8FAFC',
          card: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.85)',
          glassSubtle: 'rgba(255, 255, 255, 0.65)',
          border: 'rgba(226, 232, 240, 0.85)',
          borderGlass: 'rgba(255, 255, 255, 0.7)',
        },
        money: {
          green: '#10B981',
          greenBg: '#ECFDF5',
          amber: '#F59E0B',
          amberBg: '#FFFBEB',
          red: '#EF4444',
          redBg: '#FEF2F2',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
