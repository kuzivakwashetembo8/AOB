# GTD-POI-005B — Finch's First Meeting: Floor 53, All-Glass Lift, Start Spawn and Dialogue — Technical Implementation Plan

**Date:** 2026-11-01  
**Repository:** `interlinkglobal/GTD`  
**Working branch:** `feature/finch-headquarters-map-20261101`  
**Baseline audited for plan:** Existing POI-004 preview at commit `c8c5373a1f95b4eada93892ee164486da8f0b497` (the then-current branch implementation). Re-verify actual branch HEAD before implementation.  
**Status:** **DRAFT FOR OWNER APPROVAL — DO NOT IMPLEMENT**  
**Narrative source of truth:** [GTD-POI-005A](./GTD-POI-005A-Finch-First-Meeting-Approved-Nine-Bubble-Dialogue-2026-11-01.md) — nine Finch lines **approved**.  
**Location source of truth:** [POI-002](./GTD-POI-002-Finch-Headquarters-Designation-and-Map-Landmark-2026-11-01.md), [POI-004](./GTD-POI-004-Finch-HQ-Glass-Elevator-Full-Height-Two-Way-Implementation-2026-11-01.md) — eastern 53-storey tower `NH-04-06-L2`.

> **Authorization gate:** This document describes a **proposed implementation only**. The owner explicitly instructed us **not to implement right away** and subsequently authorized **documentation**, not gameplay changes. Do not write/modify runtime code, GLBs, props, colliders, tests, branches, builds, previews, merges, or deployments on the strength of this proposal. Ask for explicit technical-plan approval before beginning implementation and continue to respect preview acceptance before any merge.

## 1. Objective and scope

Transform the already navigable Finch HQ ground floor and top-floor landing into the first story encounter. Preserve the six requirements in the owner's order:

1. Place actual **`Finch.glb`** in the **top-floor room**.
2. Furnish the **53rd floor** as a believable combined **hotel suite, library, and executive office**.
3. Make the **elevator fully glass** while retaining working doors, a visible ride and solid/consistent physics.
4. Make a **new game** start with **Voight outside Finch HQ beside a yellow parked, drivable car**.
5. Restyle **Floor 53 / Ground Floor** elevator travel controls to match G.T.D.'s **existing** mobile/desktop action-button system.
6. Once Voight is **on floor 53 and approaches Finch**, show **nine sequential silent chat bubbles** using the precise owner-approved dialogue in POI-005A; no voice.

**Narrative outcome:** Introductory conversation ends with Finch hinting at a future case. **Do not implement or auto-start case 001, auto-assign any of the 100 NPC identities, place a payphone, or modify the established mission loop in this tranche.** Finch gives assignments face-to-face; The Machine later supplies contextual clues via ringing payphones.

## 2. Existing technical baseline and constraints

The current preview branch includes:

| Existing module | Observed behavior | Relevant change |
| --- | --- | --- |
| `src/game/experiments/north-heights-finch-hq-001.ts` | Canonical `NH-04-06-L2` building, entrance and 53-storey meeting location metadata | Reuse the building ID; do not duplicate or move tower |
| `src/game/experiments/north-heights-finch-elevator-structure-004.ts` | Shared 5.1m square shaft cutout and 14s vertical travel reference | Preserve one geometrically consistent lift shaft |
| `src/game/experiments/north-heights-finch-lobby-004.ts` | White lobby, simple top landing, partially glass cabin, metallic sliding doors, formal receptionist `GTD_NPC_025`, proximity/travel state | Replace non-glass car surfaces/doors with glass; extend the top-floor environment |
| `src/game/experiments/north-heights-reconstruction-001.ts` | Batched visual towers, upper floors and white surfaces | No broad rebuild of the 142 other buildings or their facades |
| `src/game/experiments/north-heights-physics-005.ts` | Rapier building wall/floor colliders; shaft voids match visual floors | Top room and furnishing collision must use walkable surfaces without blocking cabin |
| `src/game/experiments/north-heights-city-8.ts` | Game controller, spawn/physics/camera, selected-car traffic, per-frame elevator state, post-ready loading | Add isolated spawn/Finch proximity bridge and lifecycle; preserve accepted movement |
| `src/routes/north-heights-preview.tsx` | React HUD and currently standalone dark elevator button panel | Use shared HUD styling; host text-bubble UI; support desktop and mobile |
| `src/ui/hud/north-heights-map-010.tsx` | `FINCH HQ` pin and map-selected car navigation | Keep map and route behavior unchanged |
| `public/GLBs/Characters/Finch.glb` | Committed, ~2.26 MB model | Load actual asset after first-playable frame, not as world-start prerequisite |
| `src/test/finch-elevator-53-floors-004.test.ts` | Simulated full ascent/descent and shaft consistency | Retain and extend, not replace with text-only assertions |

**Physical layout:** `NH-04-06-L2` center roughly `X=46.002, Z=-94.180`, footprint about `22.669 × 33.889m`, entrance on the `+Z` face. Derive **all vertical coordinates** and furniture offsets from the runtime lot/shaft values, *not* fixed guesses. The last preview exposes a room at floor 53 but does **not** yet place Finch or furnish that floor. Current car population consists of 125 deterministic NH012 road agents; the accepted render model is native Sedan, not parked GLB fleet. Avoid violating its identity/collision model.

## 3. Proposed work packages (sequential gates)

### POI-005-01 — Asset, coordinates and current-state audit

- Verify `Finch.glb` actual glTF content, skin/skeleton, clip names (expected prior export configuration: Idle / Talk / Sit Idle, **verify actual asset**), world dimensions, root/ground alignment, material budget and expected direction.
- Inspect exact floor-53 collision and shaft landing height (distinguish visual floor Y from Rapier capsule-center Y).
- Confirm whether current glass transparency works in desktop/mobile Babylon renderer, including depth order and reflections.
- Inspect common action-control classes, sizes, icons, safe areas, focus behavior, visibility priority and input mapping in `GameHud`, `TouchControls`, and `DesktopControls`.
- Locate current `footSpawn` and reset/save-resume paths, road curb/parking permissions, existing nearest parked vehicle entry rules, and accepted Sedan mesh/physics constructors.
- Produce bounded geometry coordinates and an asset/clip audit. If the Finch rig or actual walkability disagrees with expectations, stop and revise the plan before generating content.

**Gate 01 acceptance:** source-of-truth coordinates, Finch clip/scale inventory, spawn constraints and game-control references are documented, without changing gameplay.

### POI-005-02 — Design floor 53 as one cohesive room with three readable zones

The 53rd-floor space is **one furnished, accessible penthouse-like operations suite**, not three fully separated floors or a new complex building interior.

**Proposed zones (subject to owner visual acceptance):**
- **Executive office:** Finch's physical standing/sitting position near a desk/work surface; chair, office lamps, restrained screens and documents; conversation sightline from the lift exit.
- **Library:** bookshelves or built-in bookcases, a reading chair, table lamp, subdued wood/neutral finishes. Actual book geometry may use repeated materials/instances, not a unique high-poly asset per book.
- **Hotel-suite lounge:** sofa or armchairs, low coffee table, rug, occasional side tables, warm light; provide a distinct accommodation atmosphere **without requiring a functioning hotel/bedroom system**. A bed/bedside area is an optional design decision for the owner to confirm in preview, not an approved room mechanic.

Preserve generous walking clearance around the lift threshold and Finch. Avoid opaque walls obstructing the city view or camera; keep exterior windows intact. Use batched instancing where appropriate. Physical collision only where necessary for desks, bookcases, large furniture, and perimeter; no invisible wall blocking Voight from Finch. Design light sources within Babylon budget so night interiors are legible but city-wide lighting is not altered.

**Gate 02 acceptance:** top-floor furniture, physical floor, panoramic views, lobby-to-lift access and an unobstructed approach to Finch all work; all other middle-floor rooms remain unrendered/unfurnished.

### POI-005-03 — Convert the elevator to fully glass

Keep the accepted centrally aligned shaft, real 14-second travel and state flow. Replace the **remaining opaque cabin shell/panels and current solid metal door faces** with transparent glass, allowing narrow realistic metallic frames, buttons, hinges, rails and indicators. A transparent ceiling/appropriate lighting should make the rising view perceptible from within the cabin; do not sacrifice basic depth cues or lose the floor platform (use translucent/structurally supported glazing as appropriate).

- Make the **four sides and front sliding doors** visually glass; retain closed-door collision and existing door-open safety.
- Verify the shaft/facade interaction at intermediate levels and prevent z-fighting/transparency-sort glitches.
- Ensure players cannot exit mid-shaft, clip through transparent panels, or fall after re-enabling gravity on either landing.
- Verify current glass-material overdraw on mobile. Use low mesh count and no gratuitous volumetric effects.

**Gate 03 acceptance:** a genuinely glass-walled car and visibly transparent front doors during ascent and descent; full up/down functionality, physics and controls unchanged.

### POI-005-04 — New-game spawn outside Finch HQ, beside one yellow parked car

Replace the **new-game starting pose** only, leaving existing durable resume mechanics intact. Spawn Voight at a pedestrian-safe exterior location near the building's `+Z` entrance and one **yellow, usable parked Sedan** to the side. The car must not obstruct the 3.2m doorway, pedestrian approach, sidewalk or passing traffic.

- Use the existing accepted native/generated Sedan geometry and driver-entry system, not a newly imported heavy GLB.
- Inspect parking and traffic ownership: either create a separately owned stationary car with explicit actor/physics lifecycle, or reserve/park a suitable existing traffic identity *without duplicating it*. Choose one proven-safe design after measuring current traffic and save/resume behavior.
- Yellow paint is grounded by the owner's direction; exact shade can be an ordinary safety yellow within the accepted vehicle paint system.
- Align the car with road grade, wheels, actual curb/parking clearance and building collision; register it for proximity entry and manual/automatic driving just like accepted game vehicles.
- A new-game start must be deterministic but **refresh/return after a saved session must resume the prior location**, not silently reset to Finch's building. Ensure no duplicate yellow car on tab resume/reload.

**Gate 04 acceptance:** new game always starts on the pavement outside the correct tower next to exactly one yellow drivable parked car; normal city traffic does not overlap it; persistence remains correct.

### POI-005-05 — Elevator-control visual parity

Replace the existing standalone top-right dark travel panel with a **contextual action** that uses the established game's action-grid size, iconography, translucent background, spacing, input priority and hover/focus states. Show **up arrow + FLOOR 53** at ground level and **down arrow + GROUND FLOOR** at top. During a ride display a small nonblocking progress indicator; do not show an additional redundant travel button.

- Keep the button accessible for touch and desktop, including safe-area placement.
- Show only when Voight is inside the cabin and the lift is ready.
- Avoid changing button ordering/size across the rest of North Heights. Use the common action component/styles instead of adding an incompatible bespoke overlay.
- Preserve pause/map behavior and no accidental travel while driving or flying.

**Gate 05 acceptance:** no new visually foreign HUD button; correct floor/direction icon, proximity, tap/keyboard accessibility, no overlap with the existing 3-column controls.

### POI-005-06 — Finch character placement and first-contact interaction

- Import the **actual** committed `Finch.glb` once the world is playable (post-first-frame streaming), at a defined standing/idle position in the office/library zone, facing the player's accessible approach. Verify body size, foot height, idle, rotation and absence of floor/desk clipping.
- Finch is separate from the 100 civilian NPC identities. Do not allocate him an `001–100` identity or a case classification.
- Define a floor-aware proximity predicate using real world **X/Y/Z**. Require on-foot Voight within the accepted interaction radius *and* within the room's valid vertical band. Avoid accidental trigger from the ground floor or through the building facade.
- When Finch is ready and the player first approaches, present the exact nine messages from POI-005A. **Only one bubble at a time** with speaker label `Harold Finch` and `1/9 … 9/9` count, manual tap/keyboard **Next**, and the same semi-transparent dark background family as game controls.
- **Proposed** interaction policy, not yet owner accepted: one automatic introductory sequence per new game, with a deliberate “Talk to Finch” replay on later visits; if interrupted by pause/exit, resume or safely reset without re-firing repeatedly. Validate against the game's existing local save/resume mechanism before choosing persistence scope.
- Keep input capture coherent; avoid dialog advancement while steering/using the elevator, and do not obscure important gameplay controls on mobile landscape.
- **No voice**, no synthesized speech, no actor imitation, no dialogue audio, no scripted mission activation. Text conclusion is not consent to start mission 001 or assign an NPC ID.

**Gate 06 acceptance:** proximity correctly triggers nine approved text bubbles on floor 53; no ground-floor trigger, repeat spam, voice, or unintended mission state.

### POI-005-07 — Integrated preview, performance and regression validation

Automate and manually inspect the **entire new-player path**:

1. Start a **new game** (no resume) outside the actual Finch HQ entrance.
2. Inspect the yellow parked Sedan; enter and exit it, verify solid collision with building and traffic.
3. Walk through white lobby, past the formal receptionist, into the fully glass cabin.
4. Confirm the elevator action matches other action buttons; press **FLOOR 53**.
5. Ascend while seeing building/window movement through the glass; safely exit on the 53rd floor.
6. Move through hotel-suite lounge, library and office. Inspect Finch's real `Finch.glb` model.
7. Approach Finch; observe all nine bubbles in exact sequence, one by one, on desktop and mobile landscape, without audio.
8. Leave and re-enter proximity: verify the decided one-time/replay policy, no looping introduction. Test interruption by pause/refresh.
9. Return to the lift, select **GROUND FLOOR**, descend and exit without clipping/falling.
10. Confirm the wider North Heights city, 125 traffic agents, 100 roaming NPC appearances, map navigation, and save/resume are unaffected.

**Performance requirements:** Record *before/after* first-playable time, network/GLB bytes, memory, frame time, mobile draw calls and long-frame spikes. Do not block playable start on Finch's GLB, decorations, or dialogue. Degrade gracefully if optional props fail, but **do not silently count Finch as ready if his essential model fails to load**. Use measured and owner-approved numerical budgets, not invented targets.

**Testing proposals:** Existing `finch-elevator-53-floors-004.test.ts`, POI map/route regression, new `poi005-finch-spawn-and-car`, `poi005-floor53-room-and-asset`, `poi005-dialogue-trigger-and-sequence` suites; include scene-based Babylon NullEngine collision/proximity and manual screenshot/playthrough evidence. Do not accept merely passing regex checks as proof of usable 3D behavior.

## 4. Risks and design choices requiring care

| Risk | Proposed mitigation |
| --- | --- |
| Finch appears mis-scaled, has no compatible Idle, or clips through desk | Inspect GLB bounds, rig, animation groups, floor alignment before placement; don't alter original GLB blindly |
| The top level looks like three disconnected demo rooms | Use distinct decorative zones inside one cohesive private suite and keep clear circulation from elevator to Finch |
| Full glass causes transparency artifacts, high GPU cost, or invisible doors | Grounded refractive color, thin frames, correct depth order and explicit material/mobile tests |
| New parked vehicle duplicates or blocks a logical traffic car | Preserve NH012 IDs, collision ownership and 125-agent path; single extra parked-car lifecycle only if permitted and tested |
| Respawn destroys accepted local save/resume | Separate `newGameStart` from `resumeSavedSession`; never reset world position on tab restore |
| Finch conversation triggers through other floors/walls | Three-dimensional height+distance and walk-mode gates; collision/visibility check if required |
| Dialogue interferes with controls or accessibility | Reuse common HUD spacing, explicit Next focus, mobile hit targets, pause and escape behavior |
| Additional heavy props hurt the accepted smooth city | Instances/caching, staged after-first-frame streaming, mobile LOD and scene disposal |
| Protected TV franchise characters, names and plot | Document IP/rights decision before any public commercial distribution; do not reproduce TV script/actor voice |

## 5. Explicit out-of-scope items

Do **not** implement mission 001 or a mission engine, fictional 100-person ID registry, 50/50 hidden role assignments, Finch voice/TTS, Machine voice, ringing payphones, police/weapon systems, new NPC animation bank, redesigned North Heights exterior, extra accessible floors, bed/sleep gameplay, financial reward system, or a production merge. Those remain separate backlog decisions.

## 6. Approval and handoff

**Owner-approved now:** Six high-level scene/interaction requirements and the **exact nine-message dialogue** in POI-005A.

**Proposed, not approved:** Engineering architecture, interior layout details, spawn-car identity strategy, dialogue replay/persistence policy, visual composition and the implementation sequence above.

**Next action:** Owner reviews this document; approves or requests edits. **Only after explicit approval** start implementation on an isolated branch or the owner-designated current feature branch, with a measured baseline. Preview and owner acceptance precede any merge or production deployment.

**No runtime modifications have been made by creation of this plan.**
