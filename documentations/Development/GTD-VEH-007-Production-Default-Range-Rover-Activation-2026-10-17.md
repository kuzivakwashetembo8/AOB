# GTD VEH-007 — Owner-Authorized Range Rover Default-On Release

**Date:** 2026-10-17  
**Owner directive:** Push to `main`, render the Range Rover at plain `/game` with no parameters, deploy once merged.
**Change scope:** activate the already implemented Range Rover GLB and inherited Ferrari/Buggy driving actor in the normal Meridian startup.

## Runtime activation

- `rangeRoverDriveEnabled(URLSearchParams)` is **true by default**, including the completely empty query string. All ordinary `/game` visits load the authentic `/Range%20Rover%20Sports%202018%20(.GLB).glb` source on Mercer Street.
- `?gtdRangeRoverDrive=0` is an explicit emergency opt-out; `=1` remains accepted but unnecessary.
- Startup awaits the actual imported Range Rover GLB, creates exactly one live `StreetVehicleActor` using the existing Ferrari/Buggy physics, and releases its parked static collider only after successful actor creation. The accepted Ferrari/Buggy are not replaced.
- Driver appearance defaults to the existing seated driver fitting system in both preview and production. The Range Rover-specific sampled shoe containment remains **provisional visual fit**, not verified interior floor collision or certified zero-clipping.
- Authored four real GLB wheel mesh hub pivots are preserved and driven by the shared quaternion wheel rig. If source model wheel nodes are missing or invalid, the rig must not invent fake spinning parts.
- The Sedan remains **delegated/pending** and absent from the active world; `ergoninane-fast-71.glb` remains loaded nowhere in default `/game`. Their repository assets and historical documentation are preserved.

## Verification and release gates

1. Validate `/game` flag policy (no parameters; arbitrary unrelated parameter; explicit `=0`), entering and exiting Range Rover, driving/reversing, named wheel-pivot evidence, cabin lower-limb tracking, original Ferrari/Buggy regressions.
2. Full Vitest, TypeScript and Vercel production-style build for the release commit.
3. Merge only after build success, then explicitly deploy merged `main` commit to production and check served `/game` and Range Rover GLB asset URLs.
4. Browser visual acceptance for physically turning wheels and fully contained Voight feet remains an independent gate. Production build success is not evidence of visual perfection.
