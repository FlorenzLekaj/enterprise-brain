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
        brand: {
          blue: '#0066FF',
          dark: '#0A0A0A',
          gray: '#1A1A1A',
        },
      },
      animation: {
        'bounce-delay-1': 'bounce 1s infinite 0ms',
        'bounce-delay-2': 'bounce 1s infinite 150ms',
        'bounce-delay-3': 'bounce 1s infinite 300ms',
      },
    },
  },
  plugins: [],
}

export default config
