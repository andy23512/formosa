const { createGlobPatternsForDependencies } = require("@nx/angular/tailwind");
const { join } = require("path");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, "src/**/!(*.stories|*.spec).{ts,html}"),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    fontFamily: {
      body: ["Roboto", '"Helvetica Neue"', "sans-serif"],
      mono: ['"Roboto Mono"', "monospace"],
      code: ["Consolas", "Courier New", "monospace"],
      "7seg": ['"FS Sevegment"', '"Roboto Mono"', "monospace"],
      logos: ["font-logos"],
    },
    extend: {
      colors: {
        formosa: {
          50: "#fff1f0",
          100: "#ffd6d1",
          200: "#ffb3ab",
          300: "#ff8a7e",
          400: "#ff6b5c",
          500: "#ff4d3d",
          600: "#f5382a",
          700: "#d92818",
          800: "#b31f12",
          900: "#8a1710",
        },
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        gray: {
          50: "#e6e6e6",
          100: "#c1c1c1",
          200: "#989898",
          300: "#6e6e6e",
          400: "#4f4f4f",
          450: "#424242",
          500: "#303030",
          600: "#2b2b2b",
          700: "#242424",
          800: "#1e1e1e",
          900: "#131313",
        },
      },
    },
  },
  plugins: [],
};
