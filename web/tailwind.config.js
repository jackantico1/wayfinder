/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12131a',
        panel: '#1b1d29',
        edge: '#2a2d3d',
        haze: '#8b90a8',
        sand: '#f4f1ea',
        pine: '#3f7d6d',
        clay: '#c97b4a',
        sun: '#e0b23f',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
