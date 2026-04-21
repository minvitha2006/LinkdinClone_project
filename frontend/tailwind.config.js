/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        linkedin: {
          blue: '#0a66c2',
          dark: '#004182',
          gray: '#f3f2ef',
        }
      }
    },
  },
  plugins: [],
}