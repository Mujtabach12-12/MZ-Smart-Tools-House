import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Vite otherwise discovers every HTML file in the repository (including test fixtures)
  // during dependency scanning. Only the real app entry should drive optimization.
  optimizeDeps: {
    entries: ["index.html"],
  },
});
