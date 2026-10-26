# GTD-OPT-010 — Implementation checkpoint
Date: 2026-10-26
Branch: `feature/gtd-opt-010-main-optimization-20261026`
Base: main after documentation commit `fb8d2a5c04fb38e3e4b93a07d37c1c4b6bf47949`
Authority: Owner explicitly approved full plan and requested feature-branch preview; **no merge or production deployment authorized**.

## Implemented source changes — scope and rationale
- OPT-01: auto-hide `GameHud` metadata with explicit INFO reveal; independent visible minimap/pause controls, reduced-motion styling. Camera can use the reclaimed header area.
- OPT-02: `NH009` native accepted-Sedan traffic now accepts active Babylon camera for screen-space visibility and three render representations; all 125 NH012 simulator identities and source paint assignments retained. Far geometry uses wheelbase/track-derived Sedan-like silhouettes, with source body, glazing and genuine wheel pairs restored close to camera; predictive rapid-descent detail promotion based on measured vertical movement rate. Thin-instance bounds updated after batch writes; never reenable rejected traffic models/dots.
- OPT-03: explicit vehicle proximity+building-envelope segment obstruction checks in North Heights; rotated building footprint checks in South Ward; same predicates govern visible vehicle button and actual boarding, with unrelated actions hidden and driving actions filtered. No vehicle button far from an accessible car.
- OPT-04: bottom-left walking joystick unchanged. Speed/sprint central large priority action; flight ascend/descend emphasized; state-filtered desktop/touch action pads.
- OPT-05: settings for currently unconnected audio/subtitle/vibration capabilities display `Coming soon` and are disabled; Pause Save/Load disabled with `Coming soon`, launcher Continue correctly disabled/labeled; unavailable combat reticle hidden.
- OPT-06: launcher Enter Meridian and New Game route to existing `/world`; South Ward and North Heights only playable; the other ten are labeled `SOON` and show a disabled district enter action without silently launching South Ward.
- OPT-07: North Heights reuses canonical South Ward `BootstrapOverlay` and `RealLoadingLedger`; real progress messages recorded as stages, including failure, with diagnostics JSON and stopwatch. First-playable frame signalled by Babylon after actual render, not inferred from physics readiness.
- OPT-08: North Heights map uses compact circular top-left road rendering with a white north-up player dot, full-screen map overlay with zoom/pan and live gameplay (no implicit pause or Meridian clock freeze).
- OPT-09: grade-aware lane paint co-generated in North Heights road surface batches (new marking layer). Detached lane `city.box` producer no longer called; crossing paint aligned to asphalt elevation.
- OPT-10: curb material uses consistent, unlit treatment and no backside culling for uniform appearance without dark corner shading.

## Verification / build history
- Initial Vercel syntax gate failed on `/world` conditional JSX; repaired.
- Second TypeScript gate found a traffic-tier identifier escaping its scope, an undefined action binding in desktop movement pad, and historical road test expecting four meshes; all repaired.
- Another TypeScript gate found an inferred `number|undefined` tuple in planar wall check; repaired with readonly tuple semantics.
- Earlier Vitest run: 545 passed / 3 failed, all three asserting superseded owner-rejected contracts (green instead of white map dot, always-visible eight action buttons, misleading low-detail count). The three tests have been updated; new GTD-OPT-010 obstruction/state/cartography tests added.
- Final Vercel checks, actual browser screenshots and mobile frame-time metrics are **pending**. Never report a preview READY until Vercel confirms it. Never claim the ten visuals are owner accepted yet.

## Outstanding owner acceptance gates
1. Vercel TypeScript, asset audits, Vitest, production build READY on latest feature SHA.
2. Owner desktop/mobile preview of every item, particularly camera-aware traffic full Sedan on rapid descent, circular map alignment, crosswalks/curbs.
3. Measured mobile/desktop frame pacing before production merge; static compilation alone does not prove 3D performance.
4. Await explicit owner authorization to merge and deploy main. Do not automatically merge.
