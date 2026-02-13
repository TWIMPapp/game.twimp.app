/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'twimp-pink': '#FF2E5B',
        'twimp-pink-light': '#FF6C88',
        'twimp-pink-soft': '#FFF0F3',
        'twimp-green': '#2DB87A',
        'twimp-green-light': '#A9D1C1',
        'twimp-teal': '#A9D1C1',
        'twimp-turquoise': '#3BBFA0',
        'twimp-yellow': '#FFD166',
        'twimp-bg': '#F8F5F2',
      },
      borderRadius: {
        'twimp': '20px',
      }
    },
  },
  plugins: [
    require('tailwindcss-animatecss'),
  ],
  purge: ['./src/**/*.{js,jsx,ts,tsx}'],
}
