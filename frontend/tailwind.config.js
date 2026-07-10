/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fb',
          100: '#e8ecf6',
          200: '#cbd5ec',
          300: '#9fb4dc',
          400: '#6d8cc8',
          500: '#4c6cb3',
          600: '#3a5293',
          700: '#2f4277',
          800: '#2a3962',
          900: '#253253',
          950: '#151b2e',
        },
        slate: {
          950: '#0a0d16',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
        'glass-dark-gradient': 'linear-gradient(135deg, rgba(15, 23, 42, 0.65) 0%, rgba(15, 23, 42, 0.85) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
