import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "richmd.core",
      fileName: (format) => `index.${format}.js`,
      cssFileName: "richmdcss",
    },
  },
});
