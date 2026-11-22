/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        spx: {
          orange: '#EE4D2D',
          dark: '#D73211',
          light: '#FFF3EF',
        },
      },
    },
  },
  plugins: [],
};
