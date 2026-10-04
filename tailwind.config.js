/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef3ff', 100: '#dce7ff', 500: '#3158b8', 700: '#23458f', 900: '#17377f' },
      },
      fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] },
    },
  },
  plugins: [],
};
