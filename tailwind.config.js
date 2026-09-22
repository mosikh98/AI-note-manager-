/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'system-ui', 'sans-serif']
      },
      colors: {
        paper: {
          DEFAULT: '#FBF7EF',
          soft: '#F4EEE1',
          dark: '#14181A',
          darksoft: '#1B2023'
        },
        ink: {
          DEFAULT: '#1E231F',
          soft: '#4A524C',
          dim: '#8A9089',
          light: '#EDEAE2'
        },
        pine: {
          DEFAULT: '#2E6F62',
          light: '#4FA593',
          dark: '#205046'
        },
        seal: {
          DEFAULT: '#C79A4B',
          soft: '#E4C989'
        }
      },
      boxShadow: {
        card: '0 1px 0 rgba(30,35,31,0.06)'
      }
    }
  },
  plugins: []
}
