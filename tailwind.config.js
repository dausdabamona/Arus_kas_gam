/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FDFBF7',
        tinta: '#1C1917',
        teal: { DEFAULT: '#0F766E', muda: '#CCFBF1', tua: '#115E59' },
        amber: { DEFAULT: '#B45309', muda: '#FEF3C7' },
        untung: '#15803D',
        rugi: '#B91C1C',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      minHeight: { sentuh: '44px' },
      minWidth: { sentuh: '44px' },
    },
  },
  plugins: [],
};
