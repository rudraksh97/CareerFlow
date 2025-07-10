const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          // Apple system fonts
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          // Google fonts
          'Roboto',
          'Google Sans',
          // Standard fallbacks
          'system-ui',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        mono: [
          // Apple monospace
          'SF Mono',
          'Monaco',
          // Google monospace  
          'Roboto Mono',
          // Standard fallbacks
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'Courier New',
          'monospace'
        ],
        display: [
          // Apple display fonts
          'SF Pro Display',
          'New York',
          // Google display fonts
          'Google Sans Display',
          'Roboto',
          // Fallbacks
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ]
      },
      colors: {
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0A0A0A'
        },
        glass: {
          50: 'rgba(255, 255, 255, 0.95)',
          100: 'rgba(255, 255, 255, 0.9)',
          200: 'rgba(255, 255, 255, 0.8)',
          300: 'rgba(255, 255, 255, 0.7)',
          400: 'rgba(255, 255, 255, 0.6)',
          500: 'rgba(255, 255, 255, 0.5)',
          600: 'rgba(255, 255, 255, 0.4)',
          700: 'rgba(255, 255, 255, 0.3)',
          800: 'rgba(255, 255, 255, 0.2)',
          900: 'rgba(255, 255, 255, 0.1)',
          950: 'rgba(255, 255, 255, 0.05)'
        },
        dark: {
          50: 'rgba(0, 0, 0, 0.05)',
          100: 'rgba(0, 0, 0, 0.1)',
          200: 'rgba(0, 0, 0, 0.2)',
          300: 'rgba(0, 0, 0, 0.3)',
          400: 'rgba(0, 0, 0, 0.4)',
          500: 'rgba(0, 0, 0, 0.5)',
          600: 'rgba(0, 0, 0, 0.6)',
          700: 'rgba(0, 0, 0, 0.7)',
          800: 'rgba(0, 0, 0, 0.8)',
          900: 'rgba(0, 0, 0, 0.9)',
          950: 'rgba(0, 0, 0, 0.95)'
        }
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
        'glass-subtle': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 100%)',
        'glass-strong': 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%)',
        'dark-gradient': 'linear-gradient(135deg, #0A0A0A 0%, #171717 50%, #262626 100%)',
        'liquid-glass': 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%)',
        'frosted-glass': 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)'
      },
      backdropBlur: {
        'xs': '2px',
        'xs-plus': '4px',
        'sm-plus': '6px',
        'md-plus': '16px',
        'lg-plus': '32px',
        'xl-plus': '48px'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.4)',
        'glass-xl': '0 25px 60px -12px rgba(0, 0, 0, 0.5)',
        'glass-subtle': '0 4px 16px 0 rgba(0, 0, 0, 0.15)',
        'glass-inset': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'liquid': '0 12px 40px -8px rgba(0, 0, 0, 0.3)',
        'liquid-lg': '0 20px 60px -12px rgba(0, 0, 0, 0.4)',
        'inner-glass': 'inset 0 1px 2px 0 rgba(255, 255, 255, 0.2)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glass-shimmer': 'glass-shimmer 3s ease-in-out infinite',
        'liquid-move': 'liquid-move 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glass-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'liquid-move': {
          '0%, 100%': { 
            borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
            transform: 'rotate(0deg) scale(1)'
          },
          '25%': { 
            borderRadius: '58% 42% 75% 25% / 76% 24% 76% 24%',
            transform: 'rotate(90deg) scale(1.1)'
          },
          '50%': { 
            borderRadius: '50% 50% 33% 67% / 55% 27% 73% 45%',
            transform: 'rotate(180deg) scale(1)'
          },
          '75%': { 
            borderRadius: '33% 67% 58% 42% / 63% 68% 32% 37%',
            transform: 'rotate(270deg) scale(1.1)'
          },
        },
      },
    },
  },
  plugins: [],
} 