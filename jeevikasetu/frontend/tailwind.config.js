/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // India.gov.in / PM-AJAY inspired palette
        govblue: {
          DEFAULT: '#1a237e',
          dark: '#0d1552',
          light: '#3949ab',
          50: '#eef1fa',
        },
        saffron: { DEFAULT: '#FF9933', dark: '#e07b1a', 50: '#fff4e6' },
        indiagreen: { DEFAULT: '#138808', dark: '#0d6606', 50: '#e8f5e9' },
        govgrey: '#f5f5f5',
      },
      fontFamily: {
        sans: ['"Noto Sans"', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16,24,40,.08), 0 6px 20px rgba(16,24,40,.06)',
      },
      keyframes: {
        pulsering: {
          '0%': { transform: 'scale(.9)', opacity: '.7' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
        wave: {
          '0%,100%': { transform: 'scaleY(.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        pulsering: 'pulsering 1.6s ease-out infinite',
        wave: 'wave 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
