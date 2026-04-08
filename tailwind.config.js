/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0a0a0a',
        'bg-card': '#141414',
        'accent-blue': '#89CFF0',
        'text-primary': '#e5e5e5',
        'text-muted': '#a0a0a0',
      },
      borderRadius: {
        'lg': '12px',
      },
      backdropBlur: {
        'md': '12px',
      },
    },
  },
};
