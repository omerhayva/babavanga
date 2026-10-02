import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        night: '#04050e',
        abyss: '#090b1c',
        veil: '#111330',
        shadow: '#1a1d42',
        amethyst: {
          DEFAULT: '#8b7bd8',
          deep: '#5d4a9e',
          soft: '#b3a7ec',
        },
        gold: {
          DEFAULT: '#d4af37',
          soft: '#c9a961',
          pale: '#e6cf8f',
          dim: '#8a7433',
        },
        mist: '#ece9e2',
        ash: '#9d9ab4',
      },
      fontFamily: {
        display: ['Georgia', 'Palatino Linotype', 'Times New Roman', 'serif'],
        body: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 0.9s ease both',
        'fade-in-slow': 'fadeIn 1.8s ease both',
        'fade-up': 'fadeUp 0.9s ease both',
        'glow-pulse': 'glowPulse 5s ease-in-out infinite',
        'float': 'floatY 9s ease-in-out infinite',
        'spin-slow': 'spin 26s linear infinite',
        'shimmer': 'shimmer 2.6s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glowPulse: { '0%,100%': { opacity: '0.55' }, '50%': { opacity: '1' } },
        floatY: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
      },
      boxShadow: {
        card: '0 0 0 1px rgba(212,175,55,0.14), 0 18px 50px -22px rgba(0,0,0,0.85)',
        'gold-glow': '0 0 42px -8px rgba(212,175,55,0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
