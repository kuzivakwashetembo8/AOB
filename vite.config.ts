// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        filename: "sw.js",
        injectRegister: null,
        registerType: "autoUpdate",
        devOptions: { enabled: false },
        manifest: false,
        workbox: {
          globPatterns: ["assets/*.{js,css,woff2}", "icons/*.png", "favicon.png", "manifest.webmanifest"],
          globIgnores: ["**/assets/*.{jpg,jpeg,webp,mp3,ogg,wav,glb,gltf,ktx2,bin}"],
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
              handler: "NetworkFirst",
              options: {
                cacheName: "gtd-shell-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 4, maxAgeSeconds: 86400 },
              },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === self.location.origin &&
                /\/assets\/.*-[\w-]+\.(js|css|woff2)$/.test(url.pathname),
              handler: "CacheFirst",
              options: {
                cacheName: "gtd-hashed-shell",
                expiration: { maxEntries: 50, maxAgeSeconds: 2592000 },
              },
            },
          ],
        },
      }),
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
