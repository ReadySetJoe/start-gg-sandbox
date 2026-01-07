import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#3f80ff',
          50: '#eff5ff',
          100: '#dbe8ff',
          200: '#bfd6ff',
          300: '#93bbff',
          400: '#6096ff',
          500: '#3f80ff',
          600: '#1f5cf5',
          700: '#1747e1',
          800: '#193ab6',
          900: '#1a358f',
        },
        accent: {
          DEFAULT: '#ff2768',
          50: '#fff1f3',
          100: '#ffe0e6',
          200: '#ffc6d3',
          300: '#ff9db1',
          400: '#ff6489',
          500: '#ff2768',
          600: '#ed1158',
          700: '#c8084a',
          800: '#a70a44',
          900: '#8d0d40',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.5',
          },
        },
      },
    },
  },
  plugins: [],
  darkMode: 'media', // Uses system preference
}

export default config