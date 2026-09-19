/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Brown scale (background & surface) ──────────────────────────
        brown: {
          950: '#3A2319',
          900: '#4A2E21',
          800: '#5A3A2E',   // ← primary background
          700: '#6B4738',   // ← secondary background
          600: '#745041',   // ← card background
          500: '#825A49',   // ← light card
          400: '#9A705B',   // ← border
          300: '#B08070',
          200: '#C8A898',
          100: '#E0D0C8',
          50:  '#F5F1E8',   // ← main text / cream
        },
        // ── Green scale (accent) ─────────────────────────────────────────
        green: {
          900: '#1C3018',
          800: '#2A4A24',
          700: '#42613B',   // ← dark green
          600: '#5A8050',
          500: '#6FA862',
          400: '#8FD17A',   // ← accent green
          300: '#B8E6A3',   // ← primary pale green
          200: '#C8F7B5',   // ← bright pale green
          100: '#DCF7CE',
          50:  '#F0FAE8',
        },
        // ── Semantic aliases ─────────────────────────────────────────────
        success: '#8FD17A',
        error:   '#E98B82',
        warning: '#E6C77A',
      },
      fontFamily: {
        sans:    ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(58,35,25,0.3), 0 4px 12px rgba(58,35,25,0.15)',
        'card-lg': '0 4px 16px rgba(58,35,25,0.35), 0 8px 32px rgba(58,35,25,0.15)',
        'btn':     '0 1px 3px rgba(58,35,25,0.4)',
        'green':   '0 0 0 3px rgba(184,230,163,0.25)',
        'input':   '0 0 0 3px rgba(184,230,163,0.2)',
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'pulse-dot':    'pulseDot 2s ease-in-out infinite',
        'bar-grow':     'barGrow 0.7s cubic-bezier(0.16,1,0.3,1) forwards',
        'spin-slow':    'spin 1.5s linear infinite',
        'count-update': 'countUpdate 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.5', transform: 'scale(0.85)' },
        },
        barGrow: {
          from: { width: '0%' },
          to:   { width: 'var(--bar-pct)' },
        },
        countUpdate: {
          '0%':   { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
