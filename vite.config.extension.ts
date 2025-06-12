import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import path from "path";

const manifest = {
  manifest_version: 3,
  name: "Leet2Git",
  version: "1.0.1",
  description: "Automatically sync your LeetCode solutions to GitHub",
  icons: {
    "16": "icon16.png",
    "32": "icon32.png",
    "128": "icon128.png"
  },
  background: {
    service_worker: "src/background.ts",
    type: "module" as const
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "Leet2Git"
  },
  options_page: "src/options/index.html",
  content_scripts: [
    {
      matches: ["https://leetcode.com/*"],
      js: ["src/content.ts"],
      run_at: "document_start"
    }
  ],
  permissions: [
    "storage",
    "webRequest",
    "tabs",
    "activeTab"
  ],
  host_permissions: [
    "https://leetcode.com/*",
    "https://api.github.com/*"
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self';"
  }
};

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
      output: {
        assetFileNames: "assets/[name].[hash].[ext]",
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js"
      }
    }
  },
  base: "./",
});
