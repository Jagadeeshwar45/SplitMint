export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        mint: { 50:'#f0fdf9', 100:'#ccfbef', 200:'#99f6e0', 300:'#5eead4', 400:'#2dd4bf', 500:'#14b8a6', 600:'#0d9488', 700:'#0f766e', 800:'#115e59', 900:'#134e4a' },
        carbon: { 50:'#f8f7f4', 100:'#ece9e0', 200:'#d5cfc0', 300:'#b5ab94', 400:'#948567', 500:'#7a6a4f', 600:'#655540', 700:'#524335', 800:'#453930', 900:'#3c312a', 950:'#1a1410' },
      }
    }
  },
  plugins: []
}