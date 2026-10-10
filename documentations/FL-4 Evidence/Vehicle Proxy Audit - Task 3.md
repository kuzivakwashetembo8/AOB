# FL4-VIS-C01–C03 — Parked Vehicle Proxy Audit and Handoff

**Date:** 2026-10-10. **Status:** C01 source audit complete; C02 and C03 blocked by repository source-write restrictions. No car rendering change was committed.

**Authority:** Meridia First Light Implementation Plan, Asset Doctrine §5 (Vehicles); FL-4 Technical Implementation Plan; FL-4 Visual Realism Decision Record, DR-05. The current production comparison commit is `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5`. Work remains on `development/meridian-fl4-optimization`.

## Active source and cost baseline

`src/game/world/first-light-runtime-source.ts` selects the **generated** world. Its active cars come from `src/game/world-generation/street-context-renderer.ts:addParkedCar`, not the inactive authored `src/game/world/first-light-world.ts` car. The deterministic placement and orientation come from `src/game/world-generation/street-context.ts:planStreetContext` using stable IDs, road geometry and seeded variation.

Per car, the active visual has **six meshes**: a 1.75 × 0.62 × 4.0 m body box at Y 0.62; a 1.55 × 0.68 × 1.95 m cabin box at Y 1.18 and Z -0.15; and four cylinders of diameter 0.62, thickness 0.18 and tessellation 12 at X ±0.88, Y 0.42, Z ±1.25. All are children of the positioned/yawed/scaled car root. Three shared materials provide paint, dark tires and glass. The two boxes contribute 24 triangles; exact wheel triangles, real draw calls, shadow costs and FPS are unmeasured.

`src/game/world/generated-first-light-world.ts:registerStreetContextCollision` creates one fixed Rapier box per car: center (item X, 0.76, item Z), half extents (0.88 × scale, 0.76 × scale, 2.0 × scale), yaw from the planner. Collider cleanup uses stored handles. Visual meshes and roots are disposed by street-context cleanup. Do not change these gameplay semantics.

## Bounded C02 implementation specification

Replace the two rectangular boxes with **two meshes**: a single painted lower hull plus tapered roof, and a single combined dark-glass mesh containing front/rear windshields and two side panes on each side. Retain the existing four wheel meshes, root transforms, three shared materials, collider, shadows, deterministic placement and disposal.

Proposed local dimensions: body spans Z ±2.0, half-width no greater than 0.85, lower Y around 0.37–0.88. Tapered cabin base extends Z -1.10 to +1.05 at Y 0.88, roof extends Z -0.68 to +0.55 at Y 1.47, roof half-width 0.65. A short trunk, sloped rear glass, long hood and sloped windshield create a believable stationary sedan silhouette. All painted body surfaces remain inside the original collision envelope. Wheel outer X extent already exceeds collider slightly in the baseline; preserve it unchanged.

Five longitudinal hull sections, one five-face roof and six window quadrilaterals would produce about **58 body/glass triangles**, versus 24 for the original two boxes; wheels remain unchanged. This is a **geometry projection, not a measured draw-call/FPS result**. Keep total mesh count six and materials three. No new textures, vehicle dynamics, traffic, damage, interiors or mobile-specific renderer changes.

## Outcome

Attempts to create a new TypeScript vehicle-geometry module through the connected GitHub source-write action were rejected, including a one-line test. The renderer therefore remains unchanged. No new regression tests, before/after screenshots or car-performance benchmarks were produced. C02/C03 and VIS-07 are **BLOCKED**, not PASS.

**Handoff:** Task 4 should preserve the original performance/regression scope, inspect this geometry contract, and reconcile source integration only if a permitted write path becomes available. Task 5 must report C02/C03/VIS-07 as outstanding. Task 1 window correction and task 2 canopy renderer integration are also blocked according to their own handoffs. Do not treat a successful preview build as visual acceptance or merge/deploy to production.
