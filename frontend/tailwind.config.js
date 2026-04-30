module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Noto Serif'", "'Tinos'", "Georgia", "serif"],
        body: ["'Noto Sans'", "'Mukta'", "system-ui", "sans-serif"],
        hindi: ["'Noto Sans Devanagari'", "'Mukta'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Government of India inspired
        navy: {
          50: "#f0f4fa",
          100: "#dce6f4",
          200: "#b8cde9",
          400: "#3b67aa",
          600: "#13407a",
          700: "#0b3d91",  // primary
          800: "#082c66",
          900: "#051d44",
        },
        saffron: "#ff9933",
        ind_green: "#138808",
        sos: "#c0202b",
        safe: "#138808",
        caution: "#d97706",
        canvas: "#f7f6f1",   // paper-like background
        surface: "#ffffff",
        ink: "#1a1a1a",
        muted: "#5d5d5d",
        rule: "#cfcfcf",
      },
      boxShadow: {
        gov: "0 1px 0 rgba(11,61,145,0.08), 0 6px 18px rgba(11,61,145,0.08)",
      },
    },
  },
  plugins: [],
};
