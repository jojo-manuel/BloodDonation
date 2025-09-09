/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphic colors
        glassLight: 'rgba(255, 255, 255, 0.1)',
        glassDark: 'rgba(0, 0, 0, 0.3)',
        pinkGlass: 'rgba(219, 39, 119, 0.3)',
        purpleGlass: 'rgba(139, 92, 246, 0.3)',
      },
      fontSize: {
        base: ['18px', '1.6'],
        lg: ['20px', '1.6'],
        xl: ['24px', '1.6'],
        '2xl': ['30px', '1.4'],
      },
      backdropBlur: {
        xs: '4px',
      },
      borderRadius: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}
