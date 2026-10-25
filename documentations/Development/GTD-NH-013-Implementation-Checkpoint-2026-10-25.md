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


## G1 wheel-and-orientation correction — 2026-10-25

**Owner observation:** sedan body moves rear-first against NH-012 traffic direction; authentic imported wheels are visually static and do not steer. **Accepted existing system:** VEH-007 original hub-centering, VEH-008 world-up steering, and WHEEL-001 universal source-qualification. Traffic agent movement and five-color body-paint behavior remain correct and are not to be rewritten.

### Actual committed Sedan GLB evidence
- Authored glTF source has exactly four physical rim nodes, four `Sculpted_tyre` nodes, and four matching `Siped tread blocks` meshes. Every part uses original source geometry/material, not procedural cylinders.
- Real hub centers at source X approximately -1.4015 (front pair) and +1.4017 (rear pair), Y 0.334, Z ±0.81; headlamp lenses at X approximately -2.37 and rear lamps +2.31. The source-longitudinal axis is X, lateral axle/roll axis Z.
- Source nodes embed hub offsets in geometry rather than independent hub transforms: the renderer must install four measured hub-centered pivots, preserving mesh world transforms.
- Actual NH-013 preview evidence: car body visual orientation reversed against authoritative agent motion, hence apply only a 180-degree sedan visual-root rotation correction; keep agent position, yaw, network and right-hand traffic rules unchanged.

### Patch contract
1. `src/game/vehicles/nh013-sedan-wheel-rig.ts` builds exactly four unique, real assembled hub pivots; each holds the actual source alloy rim, sculpted tire and original tread mesh. Fail closed on missing/ambiguous parts, invalid dimensions, parent mismatch or hub-spacing.
2. Reuse existing `StreetVehicleWheelRig` with source spin axis Z and VEH-008 world-yaw steering. Only front wheels steer; all four roll.
3. `north-heights-sedan-visuals-013.ts` computes actual positive distance moved by each NH-012 agent since its previous rendered pose, and heading-change-derived steering, with bounded smoothed toe. Neither wheel motion nor LOD switching modifies NH-012 simulation truth or introduces Rapier driving actors.
4. Apply `NH013_SEDAN_HEADING_CORRECTION = Math.PI` to the fitted visual normalization node in all three LODs, not to traffic route coordinates.
5. Preserve the five approved body paints and diagnostic dot fallback when an LOD/wheel asset cannot qualify.
6. Unit test real GLB mesh names, front/headlight negative-X axis, four corner topology, straight/left/right heading-to-wheel motion, and missing-wheel fail-closed behavior.

### Acceptance requirements
- Desktop and mobile preview: sedan bonnet consistently faces travel direction on straight roads and while turning; no reverse-slide, and no camera/player traffic-direction regression.
- Four imported tire, rim and tread assemblies rotate when advancing; both front wheels toe toward the turn while rear only roll. No detached source geometry, spinning brake housings, wheel/tyre misalignment, ground clipping or synthetic wheel substitutes.
- Wheel behavior works after LOD transitions and pause/resume; paint variation, NH-012 dots, 125 simulation agents and six original parked driving cars remain unchanged.
- Successful TypeScript/build/tests and Vercel READY are prerequisites but **not visual acceptance**. No merge to main or production deploy unless separately authorized.


## G2 — Grade-contact, turn-steering, high-flight view and hatchback intake (2026-10-25)

**Directive:** Preserve the successful sedan body colour variants and accepted autonomous NH-012 dot traffic while correcting sedan wheel contact on North Heights hills, full front-wheel steering, improving car discovery from the flight camera, and assigning the second imported everyday passenger model to existing agents.

**Screenshots/evidence:** With Voight inspecting a red sedan on Eastbank Road, tyres visibly intersect the upward terrain/road grade; front wheels turn insufficiently around junction curves. Colours and sedan forward direction are accepted. NH-012's positions/speeds/routes are not defective and must remain untouched.

**Root issue:**
- Previous renderer sampled `northHeightsGround()` once at the chassis centre and set only a flat yaw. North Heights rises by ~44m and has sinusoidal road grade; the front/uphill tyres could be under the asphalt.
- Prior visual steering inferred turn yaw from discrete 20Hz traffic pose updates but smoothed it every 60Hz render frame, decaying the toe toward zero even while traffic followed a curve.
- Previous visibility gating within ~180m horizontal travel made few cars discoverable during higher-altitude flight.

**Changes and technical contracts:**
1. `nh013-road-grade-contact.ts` uses the same North Heights terrain function as the rendered asphalt, sampling four tyre support positions at ±half wheelbase and ±half track. It computes a graded body translation and yaw/pitch/roll transform with road-contact clearance; the real traffic lane position remains unchanged. This is a source-derived **visual terrain-support model**, NOT independently approved dynamic suspension or actual near-player Rapier chassis collision.
2. `nh013-traffic-turn-steering.ts` samples real NH-012 cubic junction turn connectors, extracts upcoming road curvature, applies a physically bounded front-wheel toe command (up to ~0.72rad) and updates toe only on traffic simulation ticks. Authentic source wheel rims, tyres and treads continue to roll together through GTD's shared VEH-008 world-yaw steering system.
3. Rendering horizon expanded from 180m to 425m horizontal around the camera so high-flying players can locate cars across districts; automatic LOD near ≤24m, mid ≤70m, far beyond uses original source-derived GLB, not arbitrary boxes or billboards. Actual frame-time budgets must be verified before rollout.
4. New second vehicle: `Fourd Confusion Hatchback.glb`, using 12 **existing** logical agents from the same 125 NH-012 identities. It has five model-specific real paint options in its separable `M_Body_ColorMain` material; original non-paint materials are retained.
5. Source `Wheel_Tires` is a single Draco-compressed four-tyre mesh; the four fancier `Ford_Rim` nodes already have authored transform pivots. Offline script `nh013-rig-hatchback-tyres.mjs` uses the project-installed `draco3dgltf` decoder to split **existing source triangles** into four wheel groups and creates four validated hub-centered transform pivots. It does **not fabricate tyres** or run decoder/mesh-splitting in the game browser. Both original fancy rims and extracted original tyre/rim/tread surfaces are animated from exactly the same NH-012 agent motion using the shared GTD `StreetVehicleWheelRig`.
6. Hatchback LOD1/LOD2 GLB derivatives are generated during build, preserving source materials and fundamental appearance. These first-pass LODs are not a claim of completed performance optimization: initial measurements ~194,926 and ~185,152 triangles per instance; next performance pass must consolidate/decimate before attempting full-city ambient traffic.

**G2 acceptance checkpoint:** In preview, Voight flies above the district and sees a mixture of source-authentic sedan and hatchback cars on actual NH-012 traffic routes while 105 other agents remain moving dots. Both models' colours stay isolated to the body. Sedans must no longer bury uphill wheels; all front wheels steer visibly throughout turning while back wheels simply roll. Tire/rim geometry must remain attached and clean. NH-010 six parked/drivable original cars, character, minimap, buildings, and existing physics must not regress.

**G2 SEC-CHECK:** No external API, no new traffic AI, no 125 full-GLB duplication, no new online source asset conversion, and no change to main. Build/test + desktop/mobile owner visual inspection are gates. No assertion of production collision physics, accepted wheel-road dynamics or acceptable mobile FPS until actual preview review. The G1 plan to scale after acceptance remains pending. Preserve original source GLBs unchanged. Do not merge/deploy to main without separate authorization.
