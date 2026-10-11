import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const DEFERRED_PRELOAD_CHUNKS = /(?:DesktopBelowFold|CommandPalette|PwaManager|ToolCard)/;

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ["index.html"],
  },
  build: {
    modulePreload: {
      resolveDependencies: (filename, deps, { hostType }) => {
        if (hostType !== "html") return deps;
        return deps.filter((dep) => !DEFERRED_PRELOAD_CHUNKS.test(dep));
      },
    },
  },
});
