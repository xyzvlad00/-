/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#05060a',
          800: '#0b0d16',
          700: '#111425',
        },
        aurora: {
          500: '#40f3ff',
          600: '#37b3ff',
          700: '#3f51ff',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(64, 243, 255, 0.25)',
      },
    },
  },
  plugins: [],
}

