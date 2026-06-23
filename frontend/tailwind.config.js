/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e3a5f', light: '#2d5282', dark: '#162d4a' },
        accent: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        success: '#10b981',
        danger: '#ef4444',
      }
    }
  },
  plugins: []
};
