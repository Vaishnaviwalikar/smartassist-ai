/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        dark: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          850: '#162032',
          900: '#0f172a',
          950: '#080f1e',
        },
      },
      animation: {
        'fade-in':     'fadeIn 0.4s ease-out',
        'slide-up':    'slideUp 0.35s ease-out',
        'slide-in':    'slideIn 0.3s ease-out',
        'pulse-slow':  'pulse 3s ease-in-out infinite',
        'bounce-dot':  'bounceDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn:   { from: { opacity: 0, transform: 'translateX(-12px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        bounceDot: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
          '40%':           { transform: 'scale(1)',   opacity: 1   },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
