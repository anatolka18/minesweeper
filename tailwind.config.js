/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./src/popup/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        diplomatic: ['SicretmonopersonalBold', 'Monospace'],
      },
    },
  },
  plugins: [],
}