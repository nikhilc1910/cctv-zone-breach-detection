/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "text-primary": "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        stroke: "hsl(var(--stroke))",
        running: "hsl(var(--running))",
        down: "hsl(var(--down))",
        idle: "hsl(var(--idle))",
        maintenance: "hsl(var(--maintenance))",
      },
      fontFamily: {
        mono: ["var(--font-body)", "monospace"],
        display: ["var(--font-display)", "serif"],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate")
  ],
}
