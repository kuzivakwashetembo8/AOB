# GTD-NH-013 — Everyday Passenger GLBs are representations of EXISTING NH-012 traffic

**Date:** 2026-10-25
**Status:** G0 source audit complete; G1 sedan-on-moving-agent pilot implementation; branch-preview acceptance pending.
**Branch:** feature/nh-013-sedan-traffic-pilot; based on accepted main including user-committed everyday GLBs, with explicit, isolated port of accepted NH-012 moving-dot logic.

## Why the user committed passenger vehicles

The NH-012 North Heights **autonomous traffic simulation ALREADY EXISTS** and has been visually accepted as working **moving coloured dots**. It already has approximately 125 logical traffic agents and directed lanes, following, braking, routing, intersection queues and autonomous turning. The four newly committed everyday GLBs are intended to **replace dot representations with recognizably ordinary cars**. They are **NOT** intended to create another traffic system, 125 static parked cars or independently scripted driving behavior.

**Source of truth:** NH-012 traffic agents continue to own model/colour identity, route, x/z location, speed, heading, junction state and 20Hz movement. NH-013 only subscribes to that state to render original/derived vehicle meshes near Voight. Until a car view has successfully loaded, its dot remains in place. At the same instant a sedan visual appears, its diagnostic dot is suppressed; reappears upon unload/failure. Nothing in the renderer is permitted to make route decisions or mutate agent positions.

## Accepted inputs (original filenames)

- Four Door Sedan.glb (879,384 bytes)
- Fourd Confusion Hatchback.glb (848,640 bytes)
- Taxi.glb (746,748 bytes)
- Renault Kango.glb (2,820,328 bytes) and Renault Kango Optimized.glb (326,092 bytes, alternate version; **not another vehicle type**).
- Six accepted drivable imported owner GLBs continue in existing North Heights parking; do not alter them. Combined fleet catalogue after complete adoption: ten models.

## G0 — GLB format and actual material-structure audit

A reproducible Node build-time script, scripts/nh013-audit-passenger-glbs.mjs, examines valid binary GLB headers and glTF JSON metadata, reporting source node/primitive/triangle/material identities, texture references and material-to-mesh usage. It does not rewrite source assets.

2026-10-25 build diagnostics:
- Four Door Sedan: 879,384 bytes; 305 nodes; 304 meshes; 305 primitives; approximately 132,082 triangles. Dedicated `paint` material (23 body parts, about 22,060 triangles), with separate chrome, steel, rubber, interior, black and lamp/glass materials. Paint's base-colour map exists; the pilot isolates it for five solid test shades, preserving non-body materials, but close-up visual signoff is required.
- Fourd Confusion Hatchback: 848,640 bytes; 146 nodes; 82 meshes; 196,671 triangles; explicit `M_Body_ColorMain` material and separable glass/plastic groups.
- Renault Kango original: 2,820,328 bytes, 13 nodes, 12 meshes, 41 primitives, approximately 225,972 triangles.
- Renault Kango Optimized: 326,092 bytes; 13 nodes, 12 meshes, 41 primitives, about 225,960 triangles. File size falls by ~88.4% but geometric complexity is essentially unchanged.
- Taxi: 746,748 bytes; 47 nodes, 29 meshes, approximately 19,916 triangles; a dedicated `body` material exists.

**G0 limitation:** Those are GLB metadata measurements, not full-model visual or wheel-rig acceptance; Renault surface classification, dimensions, source rights and true gameplay colour fidelity remain pending G2. Do not infer that smaller GLB automatically yields cheaper rendering.

## G1 sedan pilot — targeted implementation

- Keep 125 NH-012 logical agents. Reidentify only **eight** deterministic agents closest to the initial North Heights player position as real Sedan identities (five paint options: White, Black, Silver, Navy Blue and Red). Preserve the existing agents' edge, progress, movement, routes, speed, 20Hz decisions and collision-safety checks.
- A new renderer asynchronously loads the provided original Four Door Sedan GLB for near views, and build-time derived medium/distant GLBs from the **same source** for farther views. No browser-time polygon reduction or conversion. No static 125-car traffic jam.
- The offline generated LOD1/LOD2 files reduce geometry nodes/primitives by conservatively omitting decorative/fine parts, while retaining body paint, wheels, windows and representative lights. They are a first source-derived view experiment, not yet an accepted optimized commercial model. Original GLB is never overwritten.
- The sedan original has a distinct material named `paint`, so **only that material** is recoloured per traffic identity. Glass/rubber/chrome/interior/light materials are never tinted; all five colours require visual acceptance especially after altering the original body base-colour texture slot.
- Lazy view switching uses distance thresholds 28m/76m/180m, with dot fallback before any view becomes ready; exact distances and LOD stability need visual tuning. No additional car source loads except tier files actually needed.
- On exit/reset, dynamically attached vehicle view hierarchies and owned source containers are cleaned. NH-010 original parking/car actors are unchanged.
- New tests establish source GLB paint slot, five paint IDs, agent count preservation, deterministic replay and original traffic placement invariance.

## SEC-CHECK — G1 implementation stage

- **Data security:** All GLBs are local to the project, no external car download/API or private data collection.
- **Change isolation:** This is a preview branch; original six parked cars, world geometry, current controls and accepted South Ward main remain unaffected.
- **Traffic safety:** Longitudinal and junction logic come from NH-012 and remain authoritative; no claim of complete Rapier interaction between Voight and these new visual traffic sedans. Near-player traffic physics belongs to a later gate.
- **Performance:** Target eight sedans, not 125 full-detail render hierarchies; tier assets generated during build, not in the browser. Need actual mobile rendering and CPU/GPU profiling before G1 approval.
- **Materials:** Body-only material `paint` is verified structurally. Visual appearance and any texture loss remain explicitly review-required, with no claim of final colours until accepted.
- **Production:** Preview only; **do not merge main** or replace NH-012 accepted dot mode without separate owner instruction.

## Next acceptance checkpoint

First significant G1 preview: Voight flies near the NH-012 moving traffic. Eight of the already-moving traffic agents render as genuine source-derived sedans in five paint colours. Other logical agents remain coloured diagnostic dots. Users inspect source fidelity, paint, model scale, movement, turns, LOD transitions and mobile performance.

**G2/G3 are not implemented in this checkpoint.** The Hatchback, Taxi and Renault variants are audited but will only join live traffic after G1 approval and their own material/LOD acceptance.
