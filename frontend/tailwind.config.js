/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        banana: '#FFD100',
        dark: '#1A1A1A',
        card: '#252525',
      },
      fontFamily: {
        doodle: ['"Gochi Hand"', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}