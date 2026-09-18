import { defineConfig } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, "../server/build"),
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "embed.html"),
      output: {
        entryFileNames: "assets/embed.js",
      },
    },
  },
});
