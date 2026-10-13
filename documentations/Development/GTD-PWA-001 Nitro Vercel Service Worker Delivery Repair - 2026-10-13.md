# GTD-PWA-001 — Nitro/Vercel Service Worker Delivery Repair

**Date:** 2026-10-13 (SAST)  
**Trigger:** Owner-approved MAT-009 merge to `main`, requiring mobile PWA clients to receive new material assets.  
**Baseline production merge:** `dcc04c44030951f15372d57ed9366f7da64eb122`.  

## Finding

The merged production application served `/game`, `/manifest.webmanifest` and BRK/WOOD/GLS asset manifests with HTTP 200, but `/sw.js` and `/workbox-d0f0e45d.js` returned **HTTP 404** from the production domain. The previous production deployment also returned 404 for `/sw.js`. This exposes an existing gap in installed-PWA update assurance, not a new glass-rendering defect.

Build logs prove `vite-plugin-pwa` creates `dist/sw.js` and `dist/workbox-d0f0e45d.js`, whereas Nitro's Vercel adapter deploys `.vercel/output/static`. Unless copied into the Vercel output, the worker is inaccessible at root scope.

## Minimal correction

`npm run build` now executes `vite build && node scripts/publish-pwa-worker.mjs`. The Node script verifies the generated worker and any referenced Workbox dependencies, then copies them into `.vercel/output/static`. It **fails the production build** if a required worker, Workbox module or Vercel output directory is missing. Other build artefacts are untouched. Outside Vercel, the worker remains in `dist` for ordinary local builds.

Automated tests cover successful publishing and fail-closed missing-file cases. No change to existing service-worker registration, root-scope manifest, runtime caching policy, image assets or game code. Existing PWA update behavior remains `skipWaiting`, `clientsClaim` and network-first navigation.

## Release gate

After preview build/tests, merge the patch as a normal GitHub PR and rebuild the resulting main SHA with Vercel `target: production`. Confirm `/sw.js` and the referenced `/workbox-*.js` return HTTP 200 and JavaScript responses on the real production aliases, as well as `/game`, the PWA manifest and the three material-family manifests. User mobile-device refresh and gameplay testing remain independent from server-side verification.
