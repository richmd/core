import path from "path";
import { defineConfig } from "vite";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "richmd.core",
      fileName: (format) => `index.${format}.js`,
      cssFileName: "richmdcss",
    },
  },
});
