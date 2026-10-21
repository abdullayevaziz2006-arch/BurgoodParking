/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Burgood Official Color Palette
        'burgood-blue': '#0084ff',
        'burgood-blue-hover': '#0073e6',
        'burgood-dark': '#0a1122',
        'burgood-border': '#15233e',
        'burgood-hover': '#121f3a',
        'burgood-cyan': '#22d3ee',
        // Backward-compatible color mapping to new Burgood theme
        'ranch-red': '#0084ff', // Electric Blue
        'academic-bg': '#f1f5f9', // Slate-100 Canvas
        'charcoal': '#0f172a', // Slate-900 Dark text
        'muted-slate': '#64748b', // Slate-500 Muted text
        'surface-gray': '#e2e8f0', // Slate-200 Borders
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'burgood': '0 10px 25px -5px rgba(0, 132, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
