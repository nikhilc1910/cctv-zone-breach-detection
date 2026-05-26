/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: '#0b0f19',       // Deep rich charcoal-blue background
          card: '#131c2e',     // Dark slate card
          border: '#242f4c',   // Tech steel border
          blue: '#1e5cc8',     // Electric blue
          success: '#10b981',  // Emerald running status
          warning: '#f59e0b',  // Amber warnings
          danger: '#ef4444',   // Red downtime alert
          purple: '#8b5cf6',   // Purple maintenance mode
          textMuted: '#94a3b8' // Gray text
        }
      }
    },
  },
  plugins: [],
}
