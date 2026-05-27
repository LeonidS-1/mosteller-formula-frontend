import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { resolveTargetConfig } from "./src/target_config";

const pagesBasePath = process.env.VITE_PAGES_BASE_PATH ?? "/inv_frontend/";
const targetConfig = resolveTargetConfig(process.env);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons.svg"],
      workbox: {
        globPatterns: ["**/*.{html,css,svg,png,webmanifest}"],
      },
      manifest: {
        name: "Invitro",
        short_name: "Invitro",
        start_url: pagesBasePath,
        scope: pagesBasePath,
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#00a9bf",
        icons: [
          {
            src: "favicon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "favicon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
    }),
  ],
  base: process.env.NODE_ENV === "production" ? pagesBasePath : "/",
  server: {
    host: true,
    port: 3001,
    strictPort: false,
    proxy: {
      "/api": {
        target: targetConfig.viteApiProxyTarget,
        changeOrigin: true,
      },
      /** Публичные объекты MinIO: /minio/<bucket>/<key> → http://<LAN_IP>:<MEDIA_PORT>/<bucket>/<key> */
      "/minio": {
        target: targetConfig.viteMediaProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/minio/, ""),
      },
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@huggingface/transformers", "@mlc-ai/web-llm"],
  },
});
