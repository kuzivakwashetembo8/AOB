import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tanstackStart(),
    nitro(),
    viteReact(),
    tailwindcss(),
    VitePWA({
      strategies: "generateSW",
      filename: "sw.js",
      injectRegister: null,
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      manifest: false,
      workbox: {
        // TanStack Start/Nitro emits client assets outside VitePWA's default
        // dist glob layout. Runtime caching is used deliberately instead of
        // fragile build-time precache globs.
        globPatterns: [],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" &&
              url.origin === self.location.origin &&
              !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "gtd-shell-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 6, maxAgeSeconds: 86400 },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              url.origin === self.location.origin &&
              ["script", "style", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "gtd-shell-static",
              expiration: { maxEntries: 80, maxAgeSeconds: 2592000 },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              url.origin === self.location.origin &&
              request.destination === "image" &&
              (url.pathname.startsWith("/icons/") ||
                url.pathname.endsWith("/favicon.png") ||
                url.pathname.endsWith("/manifest.webmanifest")),
            handler: "CacheFirst",
            options: {
              cacheName: "gtd-shell-brand",
              expiration: { maxEntries: 20, maxAgeSeconds: 2592000 },
            },
          },
        ],
      },
    }),
  ],
});
