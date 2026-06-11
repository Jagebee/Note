import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bgStart: '#0a0a0a',
        bgEnd: '#1a1a1a',
        card: '#1f1f1f',
        mutedText: '#b4b4b4',
        accent: '#f97316'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.28)',
        glow: '0 0 0 1px rgba(249,115,22,0.28), 0 8px 32px rgba(0,0,0,0.32)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};

export default config;
