/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: 0, transform: 'translateX(-12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'check-pop': {
          '0%': { transform: 'scale(.6)', opacity: 0 },
          '60%': { transform: 'scale(1.2)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: 0.6 },
          '100%': { transform: 'scale(2.4)', opacity: 0 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        bell: {
          '0%, 50%, 100%': { transform: 'rotate(0deg)' },
          '10%, 30%': { transform: 'rotate(15deg)' },
          '20%, 40%': { transform: 'rotate(-15deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .35s ease-out',
        'pop-in': 'pop-in .25s ease-out',
        'slide-in': 'slide-in .3s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'check-pop': 'check-pop .35s cubic-bezier(.34,1.56,.64,1)',
        ripple: 'ripple .55s ease-out',
        float: 'float 3s ease-in-out infinite',
        gradient: 'gradient 6s ease infinite',
        bell: 'bell 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
