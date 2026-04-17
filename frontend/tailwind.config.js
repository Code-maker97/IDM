module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Cabinet Grotesk'", "'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        base: "#09090b",
        surface: "#18181b",
        border: "#27272a",
        sos: "#ef4444",
        safe: "#10b981",
        caution: "#f59e0b",
        ai: "#3b82f6",
      },
      boxShadow: {
        sos: "0 0 30px rgba(239,68,68,0.55)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
