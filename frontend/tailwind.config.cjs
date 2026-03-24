/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class'],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        foreground: 'var(--text-main)',
        border: {
          DEFAULT: 'var(--border)',
          light: '#E5E7EB',
        },
        primary: {
          DEFAULT: '#1FB6A6',
          hover: '#159A8C',
          soft: '#F3FAF9',
        },
        brand: {
          DEFAULT: '#1FB6A6',
          hover: '#159A8C',
          soft: '#F3FAF9',
          section: '#E8F5F3',
          accent: '#3FD3C2',
        },
        text: {
          dark: '#1F2937',
          secondary: '#6B7280',
        },
        charcoal: '#1F2937',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #1FB6A6, #3FD3C2)',
      },
      borderRadius: {
        brand: '12px',
        card: '16px',
      },
      boxShadow: {
        'card-soft': '0 8px 30px rgba(0, 0, 0, 0.05)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
        heading: ['var(--font-heading)', 'Inter', 'sans-serif'],
      },
      animation: {
        blob: 'blob 7s infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
};

module.exports = config;
