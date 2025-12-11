/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E0F7FA',
          100: '#B2EBF2',
          200: '#80DEEA',
          300: '#4DD0E1',
          400: '#26C6DA',
          500: '#0096A6', // main teal (left logo)
          600: '#007A88',
          700: '#005B70', // overlap / deep teal
          800: '#004054',
          900: '#002A39',
        },
        accent: {
          50: '#E0F9F1',
          100: '#B2F2DD',
          200: '#80E8C9',
          300: '#4FDEB4',
          400: '#26D6A5',
          500: '#00C48C', // right logo
          600: '#00A372',
          700: '#00865C',
          800: '#006646',
          900: '#004531',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
