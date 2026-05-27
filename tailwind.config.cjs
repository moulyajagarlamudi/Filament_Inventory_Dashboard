module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f9ff',
          100: '#e6f0ff',
          500: '#0b6eff'
        },
        navy: {
          DEFAULT: '#08223b',
          700: '#0b2540'
        }
      }
    }
  },
  plugins: []
}
