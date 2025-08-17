/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#6366F1',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#8B5CF6',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#1F1F1F',
          foreground: '#A1A1AA',
        },
        border: '#2A2A2A',
        input: '#1A1A1A',
        ring: '#6366F1',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        'jetbrains-mono': ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'gradient': 'gradient 3s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
    },
  },
  plugins: [],
}
