/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        weddingGold: '#D4AF37',
        weddingDark: '#1A1A1A',
      }
    },
  },
  plugins: [],
}