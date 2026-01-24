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
        'twimp-teal': '#A9D1C1',
        'twimp-pink-light': '#FF6C88',
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
