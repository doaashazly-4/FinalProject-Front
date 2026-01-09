/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Dark Blue
        'primary-dark': {
          DEFAULT: '#192A45',
          light: '#243656',
          lighter: '#2d4268',
        },
        
        // Green Palette
        'primary-green': {
          DEFAULT: '#4CAF50',
          dark: '#3d8b40',
          light: '#66bb6a',
        },
        
        // Teal Palette
        'secondary-teal': {
          DEFAULT: '#1E5A5C',
          light: '#2a7577',
        },
        
        // Gold Palette
        'accent-gold': {
          DEFAULT: '#FFD700',
          light: '#ffeb3b',
          dark: '#ffc107',
        },
      },
      fontFamily: {
        'arabic': ['Cairo', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
      boxShadow: {
        'green': '0 10px 30px rgba(76, 175, 80, 0.25)',
        'green-lg': '0 14px 40px rgba(76, 175, 80, 0.35)',
        'gold': '0 8px 24px rgba(255, 215, 0, 0.3)',
        'dark': '0 10px 30px rgba(25, 42, 69, 0.15)',
        'dark-lg': '0 20px 50px rgba(25, 42, 69, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        }
      },
    },
  },
  plugins: [],
}
