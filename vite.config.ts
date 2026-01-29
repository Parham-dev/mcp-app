import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const INPUT = process.env.INPUT;
if (!INPUT) {
  throw new Error("INPUT environment variable is not set");
}

const isDevelopment = process.env.NODE_ENV === "development";

// Extract app name from input path (e.g., "apps/recipe-remix/mcp-app.html" -> "recipe-remix")
const appMatch = INPUT.match(/apps\/([^/]+)\//);
const appName = appMatch ? appMatch[1] : "default";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // Set root to app directory so output structure is clean
  root: appMatch ? path.resolve(`apps/${appName}`) : ".",
  build: {
    sourcemap: isDevelopment ? "inline" : undefined,
    cssMinify: !isDevelopment,
    minify: !isDevelopment,

    rollupOptions: {
      input: appMatch ? path.resolve(INPUT) : INPUT,
    },
    // Output relative to root
    outDir: appMatch ? `../../dist/apps/${appName}` : "dist",
    emptyOutDir: false,
  },
});
