/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8EE',
        lavender: '#B8A9E8',
        coral: '#FF9B9B',
        mint: '#7DCEA0',
        skyblue: '#85C1E9',
        sunny: '#F9E154',
        bone: '#C4956A',
        peach: '#FFB7C5',
        tangerine: '#FFB347',
      },
      fontFamily: {
        game: ['"ZCOOL KuaiLe"', 'cursive'],
      },
    },
  },
  plugins: [],
}
