# GTD-OPT-010 — Main Branch Optimization: Comprehensive Technical Implementation Plan

**Date:** 2026-10-26  
**Repository:** `interlinkglobal/GTD`  
**Inspected baseline:** `main` at `6ae6cd6e15b436448e737d690ade71a0e54db3ab`  
**Status:** **PROPOSED — OWNER APPROVAL REQUIRED. NO IMPLEMENTATION AUTHORIZED.**  
**Scope:** Ten owner-specified defects and ten sequential owner clarifications, completed 2026-10-26.  
**Source of truth:** This document plus accepted behavior from existing GTD technical records. In any conflict, the explicit owner decisions below govern.

## 0. Approval boundary and non-negotiable protections

This commit is **documentation only**. It does not authorize patching, refactoring, opening deployment previews, merging application code, altering assets, modifying main's runtime behavior, or publishing a deployment. After owner approval: create a dedicated implementation branch from a freshly verified `main` SHA, execute work in small verifiable stages, report results, supply desktop/mobile preview for visual acceptance, and obtain separate authorization before merge/deploy. No unaccepted branches or source assets should be mixed in. Preserve Procedure DDD for failed approaches.

Preserve the **single accepted source-derived Four Door Sedan** for the entire **125-agent North Heights moving traffic circuit**: deterministic paint diversity, body/glazing/rims/tyres, steering, wheel roll, road-grade contact, lane reservations and identities. Never revive rejected BMW, hatchback, taxi, Kangoo or other traffic appearances; those historical assignments may still exist in simulation metadata and parked/drivable vehicles are separate. No dots. Keep South Ward accepted gameplay, landscape mobile presentation, arrows for desktop movement and approved mobile controls, offline/PWA, loading persistence and settings storage working. Do not claim performance success from static tests alone.

## 1. Owner decision register — ten locked requirements

| ID | Problem | Owner-approved resolution |
| --- | --- | --- |
| OPT-01 | Header metadata obstructs camera | **B. Auto-hide** metadata after a brief visible period, re-expose through deliberate header-area interaction. Essential pause/map affordances remain accessible. |
| OPT-02 | Traffic renderer glitches | **B. Camera-visible streets + progressive vehicle LOD**, not a small fixed distance (specifically not the failed 58 m threshold). Viewpoint, height and street visibility govern representation; rapid aerial descent must expose full accepted Sedan before close-up, with no proxy surprise, blank frames or obvious pop. Retain 125 logical agents. |
| OPT-03 | Irrelevant action buttons | Show car entry only in **physical proximity AND with an unobstructed accessible path**; walls must block. Hide all non-driving actions while driving; hide unfinished Aim, Interact and similar on-screen gameplay buttons completely. |
| OPT-04 | Unmemorable action layout | Priority-driven layouts. **Walking movement joystick bottom-left unchanged**. On the right, sprint/speed is the largest central anchor on foot; fly/jump/other valid controls surround it. During flight, preserve speed center position and promote ascent/descent to larger touch targets; incompatible controls disappear. Dedicated driving layout. |
| OPT-05 | Unimplemented settings/menu controls appear live | In **settings/global menus**, keep such features **visible but truly disabled**, accompanied by **“Coming soon”**; do not present working affordances. Distinguish OPT-03: unfinished **in-game action controls are hidden entirely**. |
| OPT-06 | Enter Meridian skips district choice | Launcher **Enter Meridian → existing `/world`**, not `/game`. Only **South Ward** and **North Heights** playable; the other ten district entries visible, clearly not ready, non-enterable. Reuse current `/world` design. |
| OPT-07 | Two loading-screen designs | North Heights and South Ward share **South Ward's loading system**: 60-second stopwatch, genuine pending/loaded/failed ledger, diagnostic export and reliable first playable frame, not a duplicated independent UI. |
| OPT-08 | Top-left map unreadable | Compact **circular, non-mirrored, north-up** compressed flat top view of actual streets; **white dot** for Voight. North movement moves dot toward top; northeast moves up/right. Click expands to **full-screen flat map without pausing world simulation**. Reference: the two owner-provided gameplay screenshot minimaps, as minimap style only. |
| OPT-09 | Road markings float | **B. Integrate markings with the road surface-generation/rendering system**, conforming to slopes, junctions and geometry, without z-fighting, clipping or floating boxes. |
| OPT-10 | Curb corners unnaturally black | **A. Uniform curb appearance**; eliminate dark corner shading so corners visually match adjoining curb, without changing overall city lighting unnecessarily. |

### 1.1 Interpretive contract for map orientation

Use **stable geographic north-up**, not camera-rotating geometry. Current North Heights world convention is `world X = east`, `world Z = north` and screen `Y` increases downward; therefore `mapX = originX + scale * worldX`, `mapY = originY - scale * worldZ`. This ensures the **white dot physically moves north/northeast in the owner-specified direction** regardless of camera orbit. If desired, a small independent facing tick can show Voight's heading; **it may rotate, the map may not mirror**. Do not replace true world movement with screen-relative motion. Full-screen map shows the actual playable district's streets, not imaginary geography for unbuilt districts.

## 2. Repository inspection — verified implementation anchors (baseline only)

| Area | Confirmed source/behavior | Planned ownership |
| --- | --- | --- |
| Launcher | `src/routes/index.tsx` links primary Enter Meridian to `/game`; New Game also targets `/game`. | Change primary entry to `/world`; audit other entry buttons for consistency. |
| Directory | `src/routes/world.tsx` renders all 12 `src/game/world/districts.ts` entries; current enter link chooses North Heights for code 05 and `/game` for all other entries. | Centralized playable route mapping, disabled non-ready enter; preserve descriptions/list. |
| Session separation | `src/ui/game-session.tsx` + persistent session host own South Ward, whereas `src/routes/north-heights-preview.tsx` owns an independent North Heights canvas/controller. | Share UI contracts via adapters; **do not combine incompatible world runtimes**. |
| HUD | `src/ui/hud/game-hud.tsx` renders objective, location/time/dev panel and pause. North Heights supplies a map slot. | Separate essential controls from auto-hiding metadata. |
| Touch controls | `src/ui/hud/touch-controls.tsx` defines static actions including `interact`, `combat`, `context`; `visibleTouchActions(driving)` filters only driving. `src/ui/hud/desktop-controls.tsx` has separate static actions. | Single capability/state-driven visibility and priority contract feeding touch + optional desktop controls. |
| Interaction | `src/game/vehicles/local-boarding.ts` offers distance/height nearest-car policy; North Heights controller in `src/game/experiments/north-heights-city-8.ts` uses `nearestSportsCar`, with no demonstrated obstruction check in that call path. | Shared accessible-target evaluator used by button visibility AND actual command authorization; retain safe disembark. |
| Traffic | `src/game/traffic/nh012-traffic-simulator.ts` contains deterministic 125-agent simulation; `src/game/traffic/nh009-sedan-only-policy.ts` audits source Sedan + paint. | **Do not rewrite traffic simulation**. |
| Traffic rendering | `src/game/experiments/north-heights-sedan-traffic-009.ts` uses multiple thin-instance source-derived mesh/material buckets for 125 agents; `alwaysSelectAsActiveMesh=true`, all agent parts/wheels transformed into buckets each update. `north-heights-city-8.ts` calls `traffic3D.update(snapshot,new Set())` without camera-driven LOD inputs. | Visibility + LOD manager and tiered resident meshes, traffic performance telemetry. |
| Road lines | `src/game/experiments/north-heights-reconstruction-001.ts` `addTwoLaneMarkings005` creates independent `city.box("lane",...)` dashes at separately sampled terrain heights. | Move into `src/game/experiments/north-heights-roads-003.ts` road surface/paint path, remove duplicate old producer only after tests. |
| Curbs | `north-heights-roads-003.ts` batches `curbFace` geometry; intersection corners use independent pavement quads; road normals/culling are special-cased. | Fix corner material, overlapping triangles, normals/winding/seam visibility; apply uniform curb shading contract. |
| Map | `src/ui/hud/north-heights-map-010.tsx` currently square, includes dense blocks/labels and draws a **green dot**; `north-heights-map-data-010.ts` uses `x+320, 320-z`. | Reusable compact circular view + expanded map, simpler road/city layers, white dot, explicit coordinate tests. |
| Map pause bug | `src/routes/north-heights-preview.tsx` calls `controller.current?.setPaused(paused || mapOpen)`; Meridian clock also stops when `mapOpen`. | Map overlay must not set paused or stop simulation clock; preserve explicit pause and background-tab lifecycle semantics. |
| Loading | `src/ui/menus/bootstrap.tsx` `BootstrapOverlay`, `live-loading-inspector.tsx`, `src/lib/real-loading-ledger.ts` and `src/ui/game-session.tsx` form South Ward loader. North Heights route shows a simple status banner instead. | Share component + genuine district-stage observer/adapter. |
| Settings | `src/ui/menus/settings-state.ts`, `settings-editor.tsx`, `session-overlays.tsx`, launcher menus. Some settings describe capability limits; Save/Load in North Heights visibly reports runtime not connected only after opening. | Feature-availability registry and accessible disabled “Coming soon” treatment without false functionality. |

Relevant accepted/historical records: `documentations/Development/GTD-GEN-VEH-009-Sedan-Only-Traffic-2026-10-26.md`; `GTD-NH-010-Implementation-2026-10-25.md`; `GTD-NH-REBUILD-006-Mobile-HUD-and-Settings-2026-10-25.md`; `GTD-OBS-105-Real-Loading-Ledger-2026-10-20.md`; `GTD-LOAD-PERSIST-001-Loading-Persistence-2026-10-24.md`; and `GTD-NH-REBUILD-005-Road-Physics-Glass-2026-10-25.md` if applicable. Older documentation is evidence, **not** permission to restore retired renderers.

## 3. Architecture to introduce after approval

### 3.1 Shared presentation state (not shared world engine)

Create a small typed, **read-only game presentation snapshot** assembled by each runtime adapter, e.g. `GTDInteractionView`:

- `district: 'south-ward' | 'north-heights'`;
- `locomotion: 'walking' | 'flying' | 'driving'`; optional `insideBuilding`;
- `playerPosition {x,y,z}`, player heading and camera pose (with known axes), accessible target ID or null;
- `availableActions: ReadonlySet<GameAction>`, with **implemented capability registry**; `speedControlAvailable`, `canAscend`, `canDescend`;
- `hudStatus` and `mapGeometry` adapter, possibly null only if a real geometry source is unavailable.

Build snapshot at modest bounded cadence/on events (enter/exit/fly switch) rather than React setState per Babylon render frame. Use **exact same eligibility check on input receipt**, not visual gating alone, to prevent stale buttons or keyboard shortcuts bypassing obstruction checks. Shared adapters must not instantiate a second Rapier/Babylon world and must preserve existing persistence lifecycle.

### 3.2 Performance instrumentation first

Before applying rendering fixes, collect reproducible baseline on `main` at **same route, seed, player height, camera, browser, resolution and graphics settings**. Record median/p95 render frame time (CPU + GPU where browser supports), max long task, draw calls, active meshes, total vertex/triangle counts, visible vehicles by tier, thin-instance matrix uploads, material/mesh count, heap if supported, startup time, and memory crash/stutter occurrences. Distinguish **simulation cost** from **render traversal**, CPU transform work, GPU vertex/fill load, garbage collection, asset loading and React UI updates. Record unsupported measures as `unavailable`, not zero.

## 4. Detailed implementation work packages

### OPT-01 — Auto-hide header metadata
**Files likely:** `src/ui/hud/game-hud.tsx`, related `src/styles.css` and North Heights route adapter.

1. Separate gameplay-critical **pause** and **minimap** tap targets from the collapsible objective/location/time/status metadata.
2. Show metadata briefly on entry, meaningful location/state update, or explicit tap on a narrow header reveal zone. Auto-hide after a **proposed ~3 s inactivity period**, adjustable during owner preview; no timer during active keyboard focus, deliberate expansion, settings manipulation or screen-reader exploration.
3. Keep layout height stable (absolute overlay instead of permanent flow consumption); use opacity/translation with pointer-events removed when hidden; honor reduced-motion accessibility; no invisible full-screen overlay intercepting camera drag.
4. Distinguish temporary game feedback/errors from optional diagnostic metadata; serious errors and pause access remain reachable.
5. Tests: auto-hide/reveal, timer cleanup, focus, mobile touch drag safety, desktop keyboard, no camera occlusion regression.

**Acceptance:** camera unobstructed when idle; predictable deliberate reveal on desktop and mobile; essential map/pause always discoverable.

### OPT-02 — View-visible, altitude-aware progressive Sedan rendering
**Files likely:** `src/game/experiments/north-heights-sedan-traffic-009.ts`, `north-heights-city-8.ts`, new `src/game/traffic/*visibility*/*lod*` modules, `nh009-sedan-only-policy.ts` tests.

1. **Preserve simulation**: `NH012TrafficSimulator.step()`, 125 stable IDs, connector state, road-grade, per-agent paint and original source record are unchanged. Rendering consumes snapshots without mutating agent behavior.
2. **Viewport + street candidate selection**: use current Babylon camera projection, frustum, altitude and **actual road segment bounding envelopes** to identify streets potentially visible. Spatially index lane segments/agents so only relevant groups receive expensive per-agent projection; include elevated aerial views and camera rotation. Avoid arbitrary 58 m radius, hard near-distance truncation, or `alwaysSelectAsActiveMesh` on all full-detail buckets. Conservatively show candidates near frustum borders; do not claim physical occlusion without building-occlusion proof.
3. **Resident tier assets**: prepare all required levels from **accepted Sedan** once at startup, never asynchronous on descent. LOD0 full qualified body/glass/trim/front/rear lamps + four authentic source wheels/rims with preserved steering and spin. LOD1 simplified Sedan-derived geometry retaining recognizable body, windows, lighting front/back and wheel silhouette. LOD2 highly economical **Sedan-shaped** far silhouette/mesh (never a dot/box/other car). Outside-frustum/invisible streets: no active visible mesh, but agents keep simulating. Preserve per-agent paint ID across all tiers.
4. **Selection metric**: projected vehicle **screen-space size/visibility** (and geometric coverage) plus camera altitude, pitch/flight speed, projected future pose and velocity. Optimize to visual error, not fixed metres. Use hysteresis and smooth shading/detail handoff to avoid flicker. Tier boundaries are to be tuned from measured representative mobile/desktop footage, **not invented fixed distances**.
5. **Rapid-descent guarantee**: LOD0 templates and buffers are already GPU-ready. Predict next camera/player positions using bounded extrapolation and promote cars about to enter near view **before** they become inspectable, with more conservative promotion when descending rapidly. On camera teleport or sudden zoom, synchronously fill close-detail batches before first visible frame; fail safe to full rather than expose cheap impostors underfoot. Evaluate flight up/down, changing camera angles, and road approach. Smooth transitions without broken wheel contact or pop.
6. **Rendering efficiency**: thin-instance buckets partitioned per tier/material/color; reuse typed-array capacity, transform cache and dirty flags; avoid per-tick allocation/spatial reindex of stable geometry; batch matrix uploads by bucket with minimal actual active counts. Define conservative per-bucket bounds and test Babylon frustum behavior (a single aggregate bound spanning full city is not effective); avoid mandatory active-mesh selection on invisible groups. Limit per-frame LOD work to a measured budget, except emergency near-camera promotions. Ensure safe dispose/reentry and reuse with cached loads.
7. **Monitoring**: counters for logical 125, LOD0/1/2, culled, upload bytes, draw calls, frame times; development-only visualization and test hooks, not permanent intrusive HUD metadata.
8. **Retain** the accepted Sedan orientation, windows, wheel rims, wheel roll/turn, slope contact, all 12 deterministic paint choices and no GLB swaps. Do not conflate existing parked six drivable cars with moving traffic.

**Acceptance:** 125 logical actors continue routing (no lost agents, no new models or dots); all streets visible from flight have matching traffic representation; no obvious proxy/unrendered gap after fast descent, zoom or camera snap; visual acceptance at ground, mid-altitude and high aerial POV; measurable improvement in frame-time/long tasks versus baseline. If proxy surprise cannot be eliminated, revert LOD strategy, not simulation.

### OPT-03 — Proximity + accessibility-gated actions
**Files likely:** `src/game/vehicles/local-boarding.ts`, North Heights controller and South Ward runtime interaction/physics, touch and desktop controls.

1. Provide one `findAccessibleVehicle(player, vehicles, collisionWorld)` query, using existing boarding radius only as a **candidate range**, checking height, reachable entry-side target, ray/shape cast or suitable collider-backed obstruction evidence. Buildings and walls block; do not depend merely on rendering visibility or front-facing alignment. Prefer stable target hysteresis near the range boundary.
2. Use the query both to publish the **enter-vehicle** UI affordance and to authorize actual vehicle entry; keyboard E/F cannot bypass it. Handle moving/locked/unavailable vehicles explicitly. While driving, show only valid steering/throttle/brake/reverse and exit; exit availability obeys existing safe stationary disembark rules.
3. In flight, walking-only buttons vanish. Unimplemented `interact`, `combat`/Aim, `context` and placeholder actions **never appear in gameplay** even if their enum remains for legacy code. Do not delete functional driving or fly mode.
4. Tests: no car nearby, just inside/outside radius, accessible beside car, wall between player and car, wall behind player, multi-car selection, parked/drivable distinction, driving state, high altitude, missing collider fails safely, key/gamepad/pointer parity.

**Acceptance:** no phantom car button, no interaction through walls, no impossible mid-drive controls, input and UI eligibility agree.

### OPT-04 — Stable priority-based dynamic action layout
**Files likely:** `src/ui/hud/touch-controls.tsx`, `desktop-controls.tsx`, `src/styles.css`, settings control preferences.

1. Preserve **walking joystick** at exact accepted bottom-left anchor, geometry and movement behavior. Build explicit action priority schema by locomotion state rather than relying on list order.
2. Ground layout: **large central speed/sprint** button in right-hand action cluster; valid secondary actions (jump, fly, car entry when eligible) around it, with deterministic spatial slots. No feature that doesn't work.
3. Flight: central speed/sprint position identical; **ascend and descend** become larger, accessible targets; jump and car-entry vanish. Review `fly` mode toggle/landing behavior before showing any button whose semantics would be false.
4. Driving: show accepted four-arrow driving arrangement where settings enable it; only valid car controls (and exit if safe). Maintain thumb clearance and camera gesture area.
5. On states transitions, return to stable slot positions; avoid layout shifts during button press, stranded press/release states or two controls occupying same touch target. Use standard responsive constraints/safe-area insets; target >=44 CSS px where practical; honor handedness, control opacity/scale, keyboard hints, desktop optional controls and landscape.
6. Tests: state-action matrix, pointer cancel/blur releases, one- vs two-finger camera control, entry/exit, accessibility labels and minimum target size in representative landscape viewports.

**Acceptance:** sprint/speed easy to find at the same center on foot/flight; movement pad unchanged; ascend/descend enlarged in flight; no overlap, offscreen targets or wasted controls.

### OPT-05 — Truthful availability in settings and global menus
**Files likely:** `settings-editor.tsx`, `settings-state.ts`, `session-overlays.tsx`, `src/routes/index.tsx`, `src/routes/settings.tsx` and other global menus.

1. Inventory every control and test whether it produces **real current-district behavior** (audio, subtitles, vibration, save/load, objectives, character, physics probes, etc.); **do not assume** an option is unimplemented without evidence.
2. Define a small capability registry with `implemented`/`unavailable` and optional district scope; keep unfinished **settings/menu items visible** but disabled with clear **“Coming soon”** text and accessible reason (`disabled`, `aria-disabled` as appropriate).
3. Do not save changes from disabled settings or allow disabled buttons to navigate to placeholder experiences. Functional controls remain enabled and retain existing persisted values. Preserve in-game overlay reuse; do not disable all options because one district lacks an engine feature.
4. Save / Load must not masquerade as ready where there is no durable save. Retain the existing live-session persistence without claiming it implements durable saves. Treat decorative/about links by observed behavior.
5. Tests: settings per-district capability, disabled focus/description, old localStorage migration without data loss, no clickable false options, enabled features still apply.

**Acceptance:** no misleading active control, every unfinished global option visibly explains “Coming soon”, in-game unfinished actions remain absent per OPT-03.

### OPT-06 — Existing /world route as true entry gate
**Files likely:** `src/routes/index.tsx`, `world.tsx`, `src/game/world/districts.ts`, optional typed `district-availability.ts`.

1. Change primary launcher **Enter Meridian** to `/world`; review `New Game` path so it does not unexpectedly bypass intended selection (proposal: route to `/world` as well unless that would break a proven Resume flow). Avoid replacing route design or district texts.
2. Maintain all **12 district cards**. Only `South Ward (02) → /game` and `North Heights (05) → /north-heights-preview` have playable entry. Other **10** show **“Coming soon / District not yet ready”**, including currently highlighted Meridian Central, and cannot launch gameplay. Selecting a card may continue to show its description; only its enter action is disabled.
3. Prefer stable typed availability mapping, not `code===05 ? North Heights : game`. Accessible disabled state, URL-safe links and keyboard behavior; preserve visual directory. Direct route access to implemented districts remains valid.
4. Tests: all 12 statuses, only two playable route targets, launcher route, no accidental fallback to South Ward on unbuilt district.

**Acceptance:** clicking Enter Meridian reliably opens `/world`; no other city district loads the wrong world.

### OPT-07 — Unified authentic loading and diagnostics
**Files likely:** `src/ui/menus/bootstrap.tsx`, `live-loading-inspector.tsx`, `src/lib/real-loading-ledger.ts`, `game-session.tsx`, `north-heights-preview.tsx`, North Heights startup callbacks.

1. Reuse South Ward's **exact visual loading shell**, 60s stopwatch, active/pending/loaded/failed grouping, long task logging and downloadable JSON. Share UI and contracts, **not necessarily the same runtime bootstrap**.
2. Map North Heights' actual startup operations to measured stages: scene/renderer, North Heights terrain and roads, buildings/colliders, tree GLB parse/instantiation, vehicles, character, traffic initialization, GPU warmup, **first genuinely playable rendered frame**. Use measured start/finish/fail timing, bounded display updates and a separate diagnostic session per district; do not fabricate percentages or mark loaded before ready.
3. Preserve existing error/retry/version awareness, ledger bounds, offline behavior and prior loading persistence. Do not make diagnostics expensive; batch UI updates, keep watchdog reporting and retain useful failure export.
4. Tests: identical visual interface for both routes, honest stage transitions and startup duration, failure visible with diagnostics, aborted/double loading cleaned up, repeated entering district doesn't orphan observers, first playable frame qualified.

**Acceptance:** one recognizably identical loading UI, accurate district-specific stages, progress truthfulness, no introduced 60-second startup regression.

### OPT-08 — Circle minimap + live full-screen city map
**Files likely:** `src/ui/hud/north-heights-map-010.tsx`, `north-heights-map-data-010.ts`, `north-heights-preview.tsx`, `game-hud.tsx`; factor common map view only if South Ward actual road graph supports it.

1. Extract deterministic flat world-to-map projection from the existing **X east / Z north** geometry source. Test cardinal, diagonal and boundary positions; no CSS negative-scale or camera-based mirroring. Static north-up road layout, white `YOU` dot (black outline for contrast). Player stays **free to move within map**, not falsely recentered/rotated in a way that reverses movement. Optional heading tick independent of map.
2. Small top-left **circular clip** with thin high-contrast perimeter, compressed whole playable area or legible local window as owner visual review dictates; remove tiny labels, excessive per-block fills and superfluous parking/city metadata. Use actual roads, clear intersections, restrained significant markers; no generated "future" district roads.
3. Tap circle expands to **full viewport flat city map** with accessible close/Escape and responsive zoom/pan. Flat map remains accurate throughout movement. Fullscreen truly uses viewport safe area with aspect-preserving scale rather than a small square floating in screen.
4. **Map != Pause**: remove `paused || mapOpen` semantics, and remove `mapOpen` from clock freeze condition. Maintain physics, traffic, rendering, Meridian time and simulation progress while expanded. Overlay may capture touches for map pan, while input holds are **released safely** at open to avoid stuck sprint/steer. Explicit pause or app-background retention still pauses as designed; do not regress `GTD-LOAD-PERSIST-001`.
5. Test north/east/northeast movement, flight movement, driven vehicle marker moving with active player position, zoom/pan, resize, pause precedence, open/close lifecycle, map staying updated while live, mobile full-screen touch event consumption.

**Acceptance:** recognizable circular screenshot-style map, **white dot** moves in true geographic direction, full-screen expansion does not pause game or clock.

### OPT-09 — Surface-integrated road paint
**Files likely:** `src/game/experiments/north-heights-roads-003.ts`, `north-heights-reconstruction-001.ts`, possibly shared `urban-surface-renderer.ts` only after scope audit.

1. Use the **existing grade-sampled road strips/junction plan** to generate lane dashes/stop/zebra markings in the same coordinate and longitudinal segmentation as asphalt; eliminate independent `InstancedCity.box("lane")` placements once new system is verified.
2. Prefer surface-associated vertices/UV masks/decals or a co-generated paint mesh sharing asphalt segmentation and exact grade samples. Choose method after measurement: avoid extra material/draw-call explosion and avoid coplanar z-fighting using a controlled surface offset/depth bias or shader mask. Any elevation tolerance is tied to projected asphalt, **not separate uncorrelated terrain sampling**.
3. Clip dashes at intersections, respect road direction, grade, sidewalk boundaries and crosswalk connectivity; stabilize front-facing normals/winding. Keep vehicle road physics surfaces and blockers unchanged.
4. Tests: sample many slope angles, peaks/dips, both axes, four-way junctions, dash spacing, intersection clearance, no hover/shimmer from low/near and high/aerial cameras, night lighting.

**Acceptance:** road paint visually adheres to its road without floating, gaps, burying or shimmering; intersections correct.

### OPT-10 — Uniform curb/corner finish
**Files likely:** `north-heights-roads-003.ts`, North Heights curb material generation in `north-heights-reconstruction-001.ts`.

1. Reproduce at inside/outside corners in day/dusk/night; isolate causes: dark material, wrong face normals/winding, layered coplanar pavement/curb triangles, per-face lighting, self-shadow or missing corner face. Do not assume it is a natural shadow.
2. Ensure consistent **uniform curb material value** through straight curb, ends and corners. Fix geometry overlaps and seam continuity first; if face lighting still darkens corner, use a constant, unlit/neutral curb finish on curb geometry only, preserving geometry depth and separate asphalt/building lighting.
3. Preserve usable curb collision, sidewalk heights, grade and driving contact; avoid blanket disabling city shadows or redrawing whole terrain.
4. Tests: visual pixel/color consistency across corner/straight comparisons at all time presets, no cracks/z-fighting, correct Rapier walk/driving clearance.

**Acceptance:** no unnaturally dark curb corners; corners visually match adjacent curb material.

## 5. Execution sequence and approval checkpoints

**Phase 0 — Branch, baseline, automated guardrails (no behavior changes):** On approval, re-read `main`, capture performance baseline, establish isolated feature branch, add tests/metrics and baseline screenshots. Build/test must pass before modifications.

**Phase 1 — Truthful navigation/loading and interface contracts (OPT-06, OPT-05, OPT-07, shared snapshot):** Remove false entry paths/placeholder active menus, instrument North startup and share loader. One preview checkpoint.

**Phase 2 — HUD/actions/minimap (OPT-01, OPT-03, OPT-04, OPT-08):** Implement auto-hide header and contextual button hierarchy, shared accessibility, accurate map and **live non-pausing expanded view**. Test walk/fly/drive on actual viewport sizes. One preview checkpoint.

**Phase 3 — Performance-critical Sedan traffic (OPT-02):** Preserve simulator; introduce tiered visibility management and resident Sedan LOD, profile and correct fast descent. Dedicated **ground + high-altitude + fast-descent** desktop/mobile visual checkpoint before proceeding. Revert unsuccessful LOD approach using DDD if acceptance fails.

**Phase 4 — Road paint and curbs (OPT-09, OPT-10):** Shared North Heights geometry pass, testing straight roads, hillside and corners; do not mix traffic assets into surface patch. One preview checkpoint.

**Phase 5 — Integration/regression/owner acceptance:** Verify all ten owner decisions with before/after evidence, consistency between districts, and performance comparison. Provide preview URL, precise Git SHA, test result, unresolved limitations and proposed merge list. **Wait for explicit owner approval before merging or production deployment**. Change sequencing can be refined following measured dependencies; owner-specified behavior cannot be silently changed.

## 6. Verification matrix and quality gates

### 6.1 Automated tests
- TypeScript check, lint, Vitest suite and production bundle build; no ignored failures.
- Route table: 12 listed, **exactly 2 enterable**, correct playable paths; Enter Meridian points to `/world`.
- Game controls: `walking`/`flying`/`driving`, car near/far, obstruction, stopped/moving, unimplemented actions, pointer press/cancel/release, fixed speed button position.
- Loader: shared component render, measured stage statuses, failure/retry/export, stopwatch semantics, no misleading fake progress.
- Map: X east / Z north projection and diagonal movement, fixed north-up orientation, white marker, full viewport overlay **without pause**; deliberate pause/lifecycle still obeys persistence.
- Traffic: `population===125`, deterministic IDs/colors, no dots/other traffic models, both low and full meshes are Sedan-derived, LOD transitions at altitude/camera angle, instantaneous close promotion on teleport/descent, intact genuine body/windows/wheels, memory cleanup.
- Roads/curbs: markings adhere to grade/junction geometry, consistent curb material, no invalid/degenerate triangles, collision not degraded.

### 6.2 Visual/manual scenarios
1. Phone in landscape (narrow and wide), tablet and desktop, touch/keyboard/mouse.
2. Walk toward and behind a wall near a parked vehicle; demonstrate hidden/revealed car button and authoritative denial through obstruction.
3. Walk→fly→high aerial overview→rapid descend→immediate street-level car inspection; turn 180° while high; no missing/proxy vehicle or stalled frame.
4. Drive then stop/exit; correct button sets, no walking/flying controls, steering/roll/road contact unchanged.
5. Open full-screen map while cars continue moving and time advances; white dot moves north and northeast correctly; close without reloading or losing state.
6. Enter both districts from directory, record identical loading shell with truthful stages, revisit without regression to persistent sessions.
7. Photograph marked hills/junctions and curb corners in day/dusk/night, side and high angles.
8. Verify offline/cached launch, returning to loaded tab, failure recovery and no permanent HUD overlays.

### 6.3 Measured performance and pass/fail
Record **before and after on the same device** under repeatable scripted path. Proposed engineering targets (subject to observed device baseline and owner visual acceptance): mobile p95 frame time **≤33.3 ms (≥30 fps equivalent)** on an agreed representative mid-tier device, desktop p95 **≤16.7 ms (≥60 fps equivalent)** where hardware supports it; avoid repeated long stalls and memory growth versus baseline. Report both distribution and worst-case rapid-descent spikes, CPU/GPU if available, and the **visible LOD population**. If baseline exceeds target, require a material measured improvement without unacceptable near-view fidelity loss; do **not** falsely report an unmeasured target as passed. Do not exceed the 60-second startup objective or trade loading regressions for tiny render gains without owner review.

**Hard fails regardless of FPS:** wrong vehicle identity, disappearing nearby traffic, dots, missing windows/rims, proxy present beside Voight after fast descent, wrong-direction minimap, map pausing simulation, car interaction through wall, false enabled Coming-soon menu, floating road markings, black curb corners, lost game session.

## 7. Risk register, mitigation, rollback

| Risk | Mitigation / rollback |
| --- | --- |
| All 125 cars visible from high altitude exceed mobile GPU limit | Screen-space tier/mesh simplification and batching; visibility on roads with actual view; benchmark, tune triangles; do not reduce logical population. |
| Rapid camera descent exposes cheap proxy | Keep LOD0 resident; predictive promotion and immediate near-frame override; owner fast-descent gate; DDD/rollback LOD only if unresolved. |
| Thin-instance bounds cull visible cars | Partition tiers spatially; conservative bucket bounds; camera-edge/city aerial tests. |
| Obstruction checks reject legal entry or allow wall bypass | Collision-query tests for real parked bays and building doorways; inspect entry-side capsule path; fail closed in uncertain cases. |
| Map overlay accidentally freezes world or makes character run | Split explicit paused state from mapOpen; stop held input on expansion without stopping simulation; test session restoration. |
| Auto-hide hides pause/map or steals orbit gesture | Separate essential affordances, small deliberate reveal hit target, focus controls and input priority. |
| Loading telemetry itself causes stutter | Bounded events/once-a-second UI snapshots, ledger caps, stage truth, per-route observer lifecycle. |
| Curbs/paint geometry introduces z-fighting/collisions | Use common road grade and topology, surface-index tests, compare physics clearance and multiple camera angles. |
| Overbroad refactor damages stable South Ward | Shared UI adapters only, branch isolation, automated parity, preserve accepted GLBs and settings/PWA/session contracts. |

Rollback: retain baseline SHA and separate implementation commits/work packages. Revert only failed stage on feature branch, document cause under `documentations/DDD/` using established Procedure DDD. Do not replace accepted Sedan or silently lower traffic population. No merge/deploy as part of this documentation approval.

## 8. Acceptance checklist for owner sign-off

- [ ] OPT-01 auto-hidden header, metadata reveal works, map/pause accessible.
- [ ] OPT-02 all 125 Sedan-only traffic agents; camera-visible street rendering and gradual dynamic representation; fast descent reveals **real accepted Sedan** without proxy pop.
- [ ] OPT-03 car entry only near unobstructed accessible vehicle; no impossible driving/on-foot/flight buttons.
- [ ] OPT-04 unchanged bottom-left walking movement; central large speed anchor; flight ascend/descend enlarged; dedicated valid driving layout.
- [ ] OPT-05 unfinished settings/menu controls visibly disabled “Coming soon”; unfinished gameplay controls hidden.
- [ ] OPT-06 Enter Meridian opens existing `/world`; only South Ward/North Heights enterable; ten others unavailable.
- [ ] OPT-07 South Ward loader UI reused in North Heights with genuine checkpoints and diagnostics.
- [ ] OPT-08 circular flat map with **white dot**, correct geographic movement, click to full-screen without pausing simulation.
- [ ] OPT-09 road markings inseparable from road-grade surface and intersections.
- [ ] OPT-10 curb corners uniform; no dark visual artifacts.
- [ ] Full tests/build pass and desktop/mobile measurements/screenshots supplied.
- [ ] **Owner explicitly accepts preview** before code merge; **separate deploy approval**.

## 9. Current decision gate

**Only this technical plan is authorized for repository commit.** The work above remains **NOT STARTED / NOT APPROVED FOR IMPLEMENTATION**. Await explicit owner approval of GTD-OPT-010 before changing source code, running implementation changes or initiating application deployment.
