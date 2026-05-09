import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/place-details": {
        target: "https://places.googleapis.com",
        changeOrigin: true,
        rewrite: (requestPath) =>
          requestPath.replace(
            "/place-details/",
            "/v1/places/"
          ),
      },
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
