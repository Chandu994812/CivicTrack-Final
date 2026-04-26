/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#1D4ED8',
        dark: '#0F172A',
        light: '#F8FAFC',
      },
    },
  },
  plugins: [],
};
