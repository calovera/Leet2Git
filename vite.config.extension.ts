import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import path from "path";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, "background.js"),
        popup: path.resolve(__dirname, "src/popup/popup.tsx"),
        options: path.resolve(__dirname, "src/options/main.tsx"),
        content: path.resolve(__dirname, "src/content.ts"),
        leetcodeHook: path.resolve(__dirname, "src/content/leetcode-hook.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          if (chunkInfo.name === "popup") {
            return "popup/index.js";
          }
          if (chunkInfo.name === "options") {
            return "options/index.js";
          }
          if (chunkInfo.name === "content") {
            return "content.js";
          }
          if (chunkInfo.name === "leetcodeHook") {
            return "leetcode-hook.js";
          }
          return "assets/[name].js";
        },
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
