export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forge: {
          blue: '#1A4FA0',
          'blue-dark': '#0D3070',
          'blue-light': '#E6F1FB',
          gold: '#F5C518',
          'gold-dark': '#D4A00E',
        }
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      }
    }
  },
  plugins: []
}
