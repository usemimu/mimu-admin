/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        clay: {
          400: '#C8774C',
          500: '#B55430',
          600: '#974127',
        },
        moss: {
          50: '#EEF5F1',
          300: '#6EB489',
          400: '#479462',
          500: '#2B7244',
          600: '#1E5232',
        },
        gold: {
          50: '#FCF7E8',
          200: '#EDD88A',
          300: '#E0BF50',
          400: '#CFA430',
          500: '#B4881C',
        },
        danger: {
          50: '#FBF0F0',
          200: '#EAA5A5',
          400: '#D14747',
          500: '#B82828',
        },
        info: {
          300: '#7FA5D5',
          400: '#4A7EC0',
          500: '#2A5FA8',
        },
        neutral: {
          50: '#F7F5F2',
          100: '#EDE9E3',
          200: '#DDD8D0',
          300: '#C5BDB3',
          400: '#A89F94',
          500: '#7E766C',
          600: '#5E574F',
          700: '#403C36',
          800: '#282420',
          900: '#0E0D0B',
        },
      },
      fontFamily: {
        display: ['Cormorant', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(14,13,11,0.06)',
        'md': '0 4px 14px rgba(14,13,11,0.10)',
        'lg': '0 12px 40px rgba(14,13,11,0.16)',
      },
      animation: {
        'pulse-dot': 'sdpulse 1.5s infinite',
      },
      keyframes: {
        sdpulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(1.25)' },
        },
      },
    },
  },
  plugins: [],
}
