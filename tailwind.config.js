/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        surface: '#1e293b',
        card: '#0f172a',
      },
    },
  },
  plugins: [],
}
