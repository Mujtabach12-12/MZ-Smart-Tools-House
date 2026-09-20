/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand: professional blue primary, dark navy text, light neutral surfaces.
        brand: {
          50: "#eef4ff",
          100: "#dbe7fe",
          200: "#bfd6fe",
          300: "#93bafd",
          400: "#5f95fa",
          500: "#3b74f2",
          600: "#2557e0",
          700: "#1e44b8",
          800: "#1c3a93",
          900: "#1b3374",
          950: "#121f47",
        },
        navy: {
          50: "#f4f6fa",
          100: "#e6eaf2",
          200: "#c7d0e0",
          300: "#9aa9c4",
          400: "#6a7ea3",
          500: "#4a5f85",
          600: "#37496b",
          700: "#293857",
          800: "#1a2740",
          900: "#0f1830",
          950: "#080e1d",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(15, 24, 48, 0.08), 0 8px 24px -8px rgba(15, 24, 48, 0.08)",
        card: "0 1px 2px rgba(15, 24, 48, 0.04), 0 4px 16px -4px rgba(15, 24, 48, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #eef4ff 0%, #dbe7fe 45%, #ffffff 100%)",
        "brand-gradient-dark": "linear-gradient(135deg, #0f1830 0%, #121f47 45%, #0a1122 100%)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
