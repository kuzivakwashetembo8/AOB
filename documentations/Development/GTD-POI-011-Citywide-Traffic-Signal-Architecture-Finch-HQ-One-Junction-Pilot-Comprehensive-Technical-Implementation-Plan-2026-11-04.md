# GTD-POI-011 — Citywide Traffic Signal Architecture
## Finch HQ One-Junction Pilot · Comprehensive Technical Implementation Plan
**Date:** 2026-11-04  
**Project:** P.O.I. / Grand Theft Division, North Heights (Meridia/Meridian)  
**Repository:** `interlinkglobal/GTD`  
**Reference baseline:** `main` at `f71819ea99a655598f7a2c84e6ac3c573dd11532` (contains both owner-added traffic-light GLBs)  
**Status:** OWNER-APPROVED PILOT IMPLEMENTATION (2026-11-04) — PRODUCTION BUILD UNVERIFIED  
**Proposed branch after owner approval:** `feature/poi-011-finch-traffic-signal-pilot-20261104`  
**Pilot limit:** Exactly ONE signalized junction, nearest the **Finch HQ entrance**; no other signalized junctions are activated without a separate approval.  
**Long-term scope:** A configurable, performant citywide traffic-signal architecture that can later operate on selected intersections in the current 121-node North Heights grid. The architecture must not imply that all 121 intersections ought to have lights.

---

## 0. Executive decision

Build a **single authoritative traffic-signal system** that issues phase and admission permissions to the existing NH012 20 Hz traffic simulator and a crossing-start permission to the existing pedestrian route simulator. Render signal-state indications by instancing the owner's two GLB models, with correct orientation, emissive lens illumination, and contextual nighttime visibility. First deploy the complete mechanism only at the one Finch HQ pilot junction. The rest of North Heights retains the accepted unsignalized reservation/all-way-stop rules.

Citywide capability is a code/data architecture, NOT a citywide asset placement authorization. One pilot → acceptance → classified corridor expansion by separately approved batches. No immediate replacement of all-way stops elsewhere; no traffic violations, law enforcement, new missions, new pedestrian GLBs, or mass lighting overhaul.

### Owner directives and boundaries

1. Two source files were already committed on `main`, under `public/GLBs/Infrastructure/`; inspect and re-use these assets rather than generating substitute traffic-light poles as a starting point.
2. Large junctions may use overhead/hanging models; smaller junctions use roadside models, subject to **actual GLB geometry inspection** rather than filename assumptions.
3. Install and functionally test ONLY the nearest junction to Finch HQ.
4. Signals must govern car behavior and pedestrian movement, not merely change colours for decoration.
5. Preserve collision solidity, validated Sedan traffic population (125), existing missions/Finch/Diane, working streetlamps, road/curb geometry and original asset policy.
6. No merge/deploy without separate owner acceptance of pilot gameplay. No post-link build-log monitoring unless the owner reports failure.

---

## 1. Verified repository inventory and evidence

### 1.1 Owner-supplied asset manifest (from actual `main` Git tree)

| Exact path | Git object SHA | Size | Proposed use (unverified until visual asset audit) |
|---|---|---:|---|
| `public/GLBs/Infrastructure/Traffic Light 2e (hanging).glb` | `a195e03a6c8bd5f7357564999304b9407c137637` | **320,520 bytes** | overhead/hanging vehicle-signal head |
| `public/GLBs/Infrastructure/traffic_light_-_free_low_poly.glb` | `1c798d6d78a3b5429a1075f5ad31692e3f935706` | **796,084 bytes** | free-standing roadside signal |

Combined source-file size is **1,116,604 bytes (~1.12 MB decimal)** before compression. These are confirmed file names, blob IDs and byte sizes; **they have not yet been decoded or visually inspected**. Model scale, pole orientation, lamp-lens submesh identities, rigging, PBR textures and mounted support are unknown. Do not assert compatibility until the GLB qualification gate.

### 1.2 Existing world and simulation contracts

- `src/game/world-generation/north-heights-location-009.ts`: 11 x 11 road axes, coordinates `-320,-256,-192,-128,-64,0,64,128,192,256,320`; named roads; the X-axis index 6 street is **Civic Avenue** and the Z-axis index 4 street is **Commerce Way**.
- `src/game/traffic/nh012-lane-network.ts`: **121 junction nodes**, **440 directed lanes** and directed Bezier connectors. Junction node IDs `NH012:N:<ix>:<iz>`, with 0-based indices. `NH012_JUNCTION_APPROACH=10`, `NH012_LANE_OFFSET=2`, simulation step `0.05s`.
- `src/game/traffic/nh012-traffic-simulator.ts`: 125 persistent agents; graph routing, line queues, junction reservation map, downstream-exit admission and Rapier/solid-field checks. Unsigned unsignalized traffic has a four-tick all-way-stop queue; `reconcileJunctionReservations001` handles orphan owners and POI-010 introduced safe alternate turns for ordinary uncommitted AI. **There is no traffic-signal phase owner at present.**
- `src/game/experiments/north-heights-pedestrian-graph-001.ts`: sidewalk and zebra crossing edge graph for 100 logical pedestrians. `src/game/experiments/north-heights-pedestrian-crossings-001.ts` is shared by pedestrian topology and `north-heights-roads-003.ts` crossing paint. No global traffic-light pedestrian admission gate yet.
- `src/game/experiments/north-heights-street-lamps-012.ts`: existing GLB import, measured-world-bounds normalization, thin-instance rendering, visibility gate, small reusable PointLight pool, 359 deterministic streetlamp placements. Reuse the technique, not the streetlamp glow values as a replacement for traffic-signal colour semantics.
- `src/game/experiments/north-heights-city-8.ts`: orchestration/renderer; creates NH012 traffic and solid hulls, advances traffic at 20Hz, advances pedestrians at 20Hz, updates visual streetlights, handles boarding, Finch routes, manual driving and pause. All one-junction state must be owned here or in pure subsystems injected here; never give independent UI/audio/render loops their own unsynchronized phase clock.
- `src/game/vehicles/nh-solid-vehicle-collision-017.ts`: vehicles treat people, buildings, trees, lamps and cars as physical blockers. Adding a green light must NOT bypass these checks.

### 1.3 Pilot-site coordinates — resolved precisely

`NORTH_HEIGHTS_FINCH_HEADQUARTERS_001` defines:
- Finch HQ building: `NH-04-06-L2`, at `{x:46.002,z:-94.18}`.
- Finch HQ **entrance**: `{x:46.002,z:-77.2355}`.

The nearest graph intersection to the **entrance** is:
- **Pilot node:** `NH012:N:6:4` (0-based `ix=6, iz=4`)
- **World centre:** `x=64,z=-64`
- **Named intersection:** **Civic Avenue × Commerce Way**
- **Planar distance from entrance:** approximately **22.34 m**
- Next closest node `NH012:N:5:4`, at `(0,-64)`, is approximately 47.87 m away.

The choice is based on Finch's entrance, not merely the centre of the 53-floor building. The signal must be placed around this exact node, but final mast locations require a physical obstruction audit of the actual rendered curb geometry, HQ entrance path, roadways and existing lamp/tree positions.

**Important verified gap:** `northHeightsPedestrianZebra001(6,4)` currently returns **false**; no zebra edges/paint are generated at this intersection. The pilot must deliberately add/validate controlled pedestrian crossings, or else its pedestrian-signal tests would be meaningless. The most economical initial option is adding `"6,4"` to the canonical zebra allocation so both road geometry and pedestrian graph generate matching crossing links according to their existing shared implementation. That currently creates the renderer's **east and north approach** zebra pairs, NOT automatically four approaches. Test and document this limitation; add south/west only if an explicitly designed, continuous, non-overlapping route is required.

---

## 2. Target architecture — source of truth and module boundaries

### 2.1 Three independent concerns

1. **Signal policy and timing (pure deterministic TypeScript):** what vehicle movements and pedestrian crossing entries are permitted at a particular node/tick; no Babylon or DOM dependencies.
2. **Traffic and pedestrian compliance (simulation):** consume the same phase snapshot; calculate braking, amber dilemma-zone behavior, downstream space, crossing protection, intersection reservation and physical collisions; no GLB names or colour materials.
3. **Visual renderer (Babylon):** receives only phase snapshots and placements, lights the correct lenses, and applies near-camera visibility/LOD. The renderer cannot grant intersection permission.

Represent configuration as immutable data:
```ts
type JunctionSignalPlan011 = {
  nodeId: string;                     // "NH012:N:6:4"
  centre: {x:number; z:number};      // {x:64,z:-64}
  class: "arterial"|"collector"|"local";
  installation: "overhead"|"roadside"|"mixed";
  enabled: boolean;
  phases: readonly SignalPhase011[];
  crossings: readonly string[];     // actual PED-001 crossing edge IDs
  offsetsTicks: number;
  priority: "fixed"|"semi-actuated"|"coordinated";
  supportsRightTurnProtection: boolean;
};
type SignalPhase011 =
  | "NS_GREEN" | "NS_AMBER" | "NS_CLEARANCE"
  | "EW_GREEN" | "EW_AMBER" | "EW_CLEARANCE"
  | "PED_WALK" | "PED_CLEARANCE" | "PED_ALL_RED";
type PhaseSnapshot011 = {
  nodeId:string; tick:number; phase:SignalPhase011; remainingTicks:number;
  // Permission is by directed approach + specific connector turn,
  // never just "junction green".
};
```
These are suggested interface contracts; exact types may be refined without changing behavior. Do not create per-lamp React component state or `setInterval` controllers.

### 2.2 Specific proposed modules

- `src/game/traffic/nh021-traffic-signal-controller.ts`: pure phase scheduler/ownership; deterministic step(0.05), stop/green/amber/crossing permissions.
- `src/game/traffic/nh021-traffic-signal-plan.ts`: canonical pilot config and future list, by graph node key. Only `NH012:N:6:4` is `enabled:true` in Stage 1.
- `src/game/traffic/nh021-movement-conflict-matrix.ts`: paths/turns and predicted hull occupancy; initially conservative exclusive vehicle reservation, future citywide safe simultaneous nonconflicting turns.
- `src/game/experiments/north-heights-traffic-signal-renderer-021.ts`: asset qualification and visual thin instances, orientation, bulbs/emissive update, near-camera prioritization, teardown.
- `src/game/experiments/north-heights-traffic-signal-placements-021.ts`: deterministic placements derived from node centre and lane direction, vetted against sidewalks, buildings, trees, existing streetlights and crossings.
- Narrow integration in `nh012-traffic-simulator.ts`, `north-heights-pedestrian-simulator-001.ts`, `north-heights-pedestrian-graph-001.ts`, `north-heights-roads-003.ts`, and `north-heights-city-8.ts`.
- New regression tests under `src/test/poi011-*.test.ts`, plus pure signal-model tests next to the controller.

Avoid introducing another traffic simulator, separate physics world, or a 121-junction full-scene actor tree at game load.

---

## 3. Stage 00 — qualify BOTH actual GLB assets without altering gameplay

### 3.1 Geometry and material inspection checklist

Inspect actual GLBs in Babylon or a glTF parser after owner authorization:
- full imported node, mesh, primitive and material manifests, dimensions and units; bounding-box extents, native up axis, forward-facing direction, intended support surface;
- number of draw calls, triangles, textures, external dependencies and CPU/GPU memory;
- whether housing/pole, arm/mount, **red/amber/green lenses** are physically separate meshes or material slots; whether both have all three lenses and if a pedestrian head is provided;
- whether the hanging model includes a physical mounting arm/cable/gantry. Never leave a traffic head floating over a junction;
- material emissive properties, PBR state, lens geometry and how imported local axes transform into road-facing world axes;
- visibility from vehicle cabin height and walking height, from near/far approaches in day/dusk/night;
- whether low-poly source uses disconnected material segments or dark opaque lenses incompatible with per-colour updates.

Treat the filename's "hanging" and "free low poly" descriptions as **suggested use only** until inspection confirms physical shape. Mark the selected pilot model `accepted`, `needs repair` or `unsuitable` with screenshots. If either GLB lacks independently colourable lenses, use a small, aligned emissive lens overlay *only after measuring real lens centres*, not a generic sphere located by guess. Do not recolour the entire pole/head when phase changes.

### 3.2 Asset budget and loading policy

- On one-junction pilot, import only the selected source type(s); do not automatically download both 321 KB and 796 KB on every boot if one is not visibly used.
- When implementing later citywide placement, decode each used source GLB **once**, create thin instances/instances of template mesh parts, and share materials/textures. No 121 separate GLB HTTP requests.
- Load signal visual assets after first-playable core physics if acceptable, without delaying movement or hiding the road surface. Signal *permissions* begin deterministically with simulator initialization; if visuals fail, use a fail-safe clearly indicated static signal fallback for the pilot or leave pilot disabled rather than an invisible permanent red.
- Add near-camera visual culling with a minimum distance at which the colour remains legible. Do not cull the logical phase state.
- Budget before/after requests, JS heap, Babylon meshes/instances/draw calls, FPS, shader compilation and first-playable time; no fabricated savings.
- Existing accepted vehicle source-GLB traffic remains disabled and new assets must not cause visible green loading dots or duplicated streetlight poles.

---

## 4. Stage 01 — physical signal placement at one Finch junction

### 4.1 Number and position

**One signalized intersection does not mean only one head.** Each controlled approach needs legible red/amber/green indications and visibility from its stopping location. The pilot needs a coherent set of approaches, not a single model near Finch's door.

Proposed initial arrangement (subject to actual model dimensions):
- An arterial-style signal head for each of the four vehicle approaches using one or both owner assets where appropriate, mounted on supports that actually exist in the GLB or a minimal justified support attached to ground; avoid a floating "hanging" model.
- On street approaches with limited overhead clearance or inappropriate model proportions, use the validated roadside asset instead.
- Near-side/far-side visibility is preferable; do not assume a single low roadside head is sufficient for a large four-way approach.
- Place pole bases outside the 8 m carriageway, avoid the 7.75 m sidewalk envelope's traversable area, maintain accessible pedestrian routes, and avoid trees, HQ doorway/crosswalk/corner curbs/parking entrances/adjacent NH-LAMP-012 installations.
- Final numeric offsets are derived from real GLB pole footprint, the existing lane endpoints, ground function, available clearance and swept-hull tests—not from arbitrary 9m or 10m offsets.
- Rotate each face against actual incoming `TrafficEdge012.dx/dz`, not a guessed axis from the model preview. All four heads must be viewed by approaching drivers, not departing drivers.

### 4.2 Physical/collision rules

- Fix the pole's base to `northHeightsGround(x,z)` and normalize vertical model position; preserve inclined terrain and accepted curb fascia.
- Register only real solid **pole/support** trunks with the existing static collision field, using measured radius/footprint. A suspended head is not a ground obstacle; its support is.
- Pedestrians must route around poles without blocking the zebra approach. Do not position bases in an elevator/door entrance or forcing NPC sidesteps through vehicles.
- Asset renderer supports pause, resume, time-of-day and destruction without leaking references; nonphysical bulbs and decorative lights are not Rapier colliders.

---

## 5. Stage 02 — phase controller, safety invariants and timing

### 5.1 Pilot phase program

Start with conservative, understandable **two-axis vehicle service plus on-demand exclusive pedestrian phase**, to avoid the most complex permissive-turn/pedestrian conflicts in the first pilot.

```text
NS_GREEN → NS_AMBER → NS_CLEARANCE
         → EW_GREEN → EW_AMBER → EW_CLEARANCE
         → (if crossing demand: PED_WALK → PED_CLEARANCE → PED_ALL_RED)
         → NS_GREEN ...
```

- **North–South green:** approaches along +Z/-Z may enter when their actual connector, downstream clearance and physical reservation permit it. East–West red. No new pedestrian crossing entries.
- **North–South amber:** announce transition. Vehicles that can brake before the correctly positioned stop line do so; those already committed to the junction clear safely. No sudden braking that causes an overlap or stop inside a connector.
- **Clearance:** affected vehicle approaches show red, new conflicting admissions blocked. Wait at least the configured clearance interval **and** ensure occupied conflicting connector bodies have cleared the conflict zone before admitting the next movement. Do not revoke an in-junction reservation just because a phase timer expired.
- **East–West green/amber/clearance:** symmetric logic.
- **Protected pedestrian phase:** **all vehicle entries red**, allow pedestrians onto the genuinely marked zebra only during `PED_WALK`; after this, accept no new pedestrian entries and allow existing crossings to clear during `PED_CLEARANCE`. Only then permit next conflicting vehicle flow. One pedestrian-requested cycle must eventually be serviced; no indefinite suppression from continuous car demand.
- **Citywide option (future only):** concurrent parallel pedestrian WALK and same-direction vehicle green with a right/left turn conflict matrix after proven safety. Not enabled in the one-junction pilot.

### 5.2 Preliminary *game* timing values — subject to measurement

Use ticks `dt=0.05s` and programmable constants. Do not claim these values are formally approved traffic-engineering timings:
- Each vehicle green **nominal 14–18 seconds**; pilot starting point **16 seconds**. Minimum green must be long enough to clear the stop-line queue without causing spillback and may later be demand-adaptive.
- Amber **3 seconds** initial trial, adjusted for simulation speed, braking rate and grade. Legal minimums vary by jurisdiction; this is not traffic engineering certification.
- Vehicle clearance **at least 2 seconds** initial trial, extended until the actual conflict area is empty rather than truncated by a timer.
- Pedestrian WALK **~5 seconds** initial trial; pedestrian clearance derived from the **measured crossing length / conservative pedestrian speed** plus entry tolerance (e.g. initially ~8–10 seconds for a short ~8m traverse). Actual geometry and NPC walk speed determine the value.
- Pedestrian phase is **on-demand**, not automatically inserted when nobody is waiting. If no pedestrian demand, two vehicle phases alternate with clearance. No active head may show both conflicting greens.
- For future coordinated corridors, phase offsets must be derived from street spacing, permitted speed and platoon arrival rather than arbitrary synchronous global tick 0.

Do not allow signal timing to use `performance.now()`, React renders or `Date.now()`: **only the existing NH012 deterministic tick** controls phases. Pause/resume, reload/restore and deterministic replay must not skip phases on wall-clock jumps.

### 5.3 Movement permissions and conflict policy

Return exact per-approach, per-turn decisions such as `PROCEED`, `STOP`, `CLEAR_COMMITTED`, `YIELD_CONFLICT`, keyed by incoming directed lane and `TrafficConnector012`. Never treat a flashing green material as permission.

Safety invariants:
1. Conflicting approaches cannot simultaneously receive admission.
2. No new red-phase entry for civilian AI. In-junction cars that entered legally are permitted to finish when physical clearance allows.
3. **Green is not a guarantee of movement:** `hasExitSpace`, collision safety, downstream occupancy, vehicle size and junction reservation must still pass.
4. Orphan reservations are reconciled by physical/connector ownership, never blindly time-expired.
5. A finite blocked downstream queue must not cause the controller to skip to an incompatible movement while a car is still in the conflict zone.
6. The pilot preserves existing exclusive junction owner admission as a conservative baseline; later optimize to multiple *nonconflicting* connectors in parallel only after swept-hull conflict-path tests.
7. Manual driving remains physically controlled by the player. Vehicle red lights inform manual drivers; **do not silently remove driving control, teleport them or add unapproved tickets/damage**. Collision blockers remain authoritative even if a player voluntarily runs a red light.
8. Diane mission route, Finch auto-drive, starter Sedan, offroad parking and manual-to-AI handback retain their path/ownership guarantees. AI-controlled mission cars comply with signals unless explicitly scripted otherwise after separate approval.

---

## 6. Stage 03 — integrate admission with existing NH012 traffic

### 6.1 Preserve unsignalized paths verbatim

At each junction queue/admission decision:
```ts
const signal = signalRegistry.get(edge.to);
if (!signal) {
  // Existing POI-010 all-way stop, waitTicks >= 4, reservation reconciliation,
  // downstream checks and legal alternate-outgoing-edge rules unchanged.
} else {
  // Candidate must have signal permission, adequate approach braking,
  // downstream capacity, ownership and solid physical clearance.
}
```
This registry is **empty for all nodes except `NH012:N:6:4`** during the pilot.

### 6.2 Correct stop-line physics

- NH012 lane centre currently ends at `NH012_JUNCTION_APPROACH=10m` before a node, while the existing zebra renderer paints its crosswalk around an approach offset ~9.55m. Do not simply paint a stop bar at the lane centre while the car's nose extends into the pedestrian crossing.
- Derive each pilot stop position from **actual approach direction, zebra polygon, measured full vehicle hull length, comfortable stopping distance and buffer**. Stop the *front bumper* before the crossing, not just the physics centre. Use an approach-specific `sStop` along the directed lane while preserving the road graph and routing.
- For a red signal, apply physically feasible deceleration with the present NH012 `BRAKE` rule and leader gap; stop ahead of the pedestrian conflict polygon. Amber includes a calculated stopping feasibility / dilemma zone.
- For green, remove the mandatory four-tick all-way stop for signalized, clearance-safe approaches **without** bypassing queued vehicle spacing. Request connector ownership before proceeding and progress continuously through the existing Bezier connector.
- If a signal becomes red after a car has entered legally, the committed reservation survives until the car clears its connector. Never turn it into a solid obstacle for an oncoming green wave.

### 6.3 Congestion and anti-deadlock

- Do not solve new red queues by fake `waitTicks` timeouts, teleporting, despawning, intangible car collisions or bypassing the POI-010 reservation reconciler.
- Implement a bounded **wait-for diagnostic** indicating signal phase, approach queue lengths, current blocker, connector owner, downstream lane headroom, pedestrian reservation and the tick when each stopped agent last advanced.
- A permanently blocked exit must not monopolize all green capacity: before committing, ordinary AI may use an alternate *legal, non-mission* connector satisfying routing and physical constraints; targeted missions retain their own destinations.
- If a connector owner cannot physically clear by the planned change, clearance waits or reverts to a safe all-red hold with a visible/debug reason; no cross-traffic green into that same body.
- A physically blocked pilot can be diagnosed from console/opt-in telemetry without adding a large on-screen Export JSON modal.
- Acceptance requires ordinary traffic elsewhere to keep moving throughout the signal cycle, including after an extended pedestrian wait.

---

## 7. Stage 04 — make the pilot's pedestrian crossing real

### 7.1 Align painted crossing and pedestrian graph

- Add the pilot `(ix=6,iz=4)` to `northHeightsPedestrianZebra001` in the smallest versioned change after verifying no duplicate paint/edges. Both road renderer and PED-001 pedestrian graph must reference the **same** allocation source.
- Current code would then create the east and north approach zebra links/paint at that node, not a symmetrical four-approach full box. Do not falsely claim four accessible crosswalks. Pilot can validate two approaches, or plan symmetric extension with new graph links and tested turning/sidewalk geometry if necessary.
- Crosswalk surface, topography, stop line, rounded curb path and support poles must remain contiguous and at the existing accepted grade.
- Link each zebra's graph edge ID to a **signal crossing permission** associated with the pilot node. NPCs elsewhere keep all existing lifecycle behavior.

### 7.2 Pedestrian admission, occupancy and bypass

- Before starting a `crossing` edge, an NPC requests permission from signal controller. On red, it stops at the **sidewalk-side waiting anchor**, not inside the road. Do not use a free-floating dot as a waiting marker.
- Record a pending WALK request on first valid waiting NPC; serve within a bounded maximum number of vehicle cycles. Only enter a crosswalk during WALK; people already halfway through the crosswalk may continue through clearance.
- A signal should not abruptly turn vehicles green if a crossing is occupied by an NPC. The collision field and crossing occupancy agree on which agents are inside. Avoid deadlocks in which a car body blocks the crosswalk indefinitely and the controller can never progress; diagnose actual owner and do not invent phantom passage.
- Mission-reserved NPCs follow their scripted route/mission ownership while still respecting real collision zones. If an authored mission requires an exception, document and seek explicit approval rather than silently disabling a signal.
- Pedestrian visible indications (WALK / WAIT) should be minimal, contextual and legible; the two owner GLBs may contain only vehicle lenses. If no pedestrian head exists, use an unobtrusive matched procedural sign/head, subject to owner visual acceptance—not a generic world-space UI pop-up.
- At non-signalized zebra crossings citywide, NPCs retain existing normal priority/avoidance; no implicit red at unsignalized crossings.

---

## 8. Stage 05 — emissive visual state, atmosphere and audio

### 8.1 One state source

The renderer receives `PhaseSnapshot011` from the same simulator tick used for car and pedestrian admission. Every corresponding head changes together; do not create independent oscillators or use asynchronous random timers.

- Red, amber and green indications are **mutually exclusive per head**; off lenses stay visually dark.
- Use physically plausible limited emissive PBR colour for active lenses, retained daytime readability, and a restrained halo/bloom at dusk/night. Do not flood the street orange or add four dynamic point lights per pole.
- Prefer a very small shared/pooled light effect near the camera if volumetric contribution is needed; far-away heads use emissive material only.
- The housing, pole and cable material remain unchanged across phases; lenses have measured attachment transforms from the real GLB.
- Validate state orientation from all four traffic approaches, not only one screenshot from the sidewalk. Road-facing/red must be legible behind the expected windshield/camera view.
- Source geometry retained and batched, scene disposal cleans up imported mesh templates/materials/lights; no ghost lights after route changes.

### 8.2 Audio and ambient behavior

No new mandatory audio download or electronic chirp in Stage 1. If a pedestrian acoustic signal is requested later, generate an unobtrusive procedural cue through the existing game audio bus, respecting master volume, pause and distance. Vehicle idle/acceleration/braking sounds continue naturally as phases change; red should not mute engines.

---

## 9. Citywide design — capable of 121 nodes, selectively activated

### 9.1 Network classification, not blanket placement

Classify junctions from actual street role, number of directed approaches, observed 125-vehicle flows, pedestrian graph demand, Finch/Diane route importance, roadside visibility and spacing. Proposed configuration tiers:

- **Arterial:** major/high-traffic crossroad, overhead primary/secondary faces where assets suit geometry, signal controller with coordinated offsets once neighboring arterial signals are accepted.
- **Collector:** mixed local/major junction, plausible roadside or mixed signal treatment; traffic demand and pedestrian desire lines determine installation.
- **Residential/local:** remain stop/yield/uncontrolled as already implemented unless observations justify installation. Avoid flashing lights on all 121 street corners.
- **Pedestrian-priority:** existing zebra crossing may be signal-controlled or remain unsignalized based on proximity to major roads and demand. A zebra alone does not automatically create a traffic light.

The current road metadata contains street names, not a verified legal road-class map. Classification is **to be developed and reviewed**, not inferred as a fact from a name like “Civic Avenue.” Finch HQ pilot is explicitly selected by the owner independently of an arterial classification.

### 9.2 Registry and deployment gates

- All future signal candidates may exist as `enabled:false` typed configuration records for planning/visualization, but their render assets and phase controllers do **not** initialize merely because a candidate record exists.
- Runtime map from `nodeId → controller` is lightweight; only approved, activated signals consume phases and GLB instances.
- Enable citywide in **separate corridors or neighborhood batches**, with a deterministic migration/rollback switch per node. Do not turn on 121 controllers after one successful pilot. Owner chooses the number and selection of future locations after preview.
- Preserve unsignalized behavior at every disabled node; regression diff can compare identical seeded traffic traces excluding local influence and spillback.
- Corridor green waves only after measuring real approach travel time and capacity; coordinate adjacent signals where useful without forcing 121 synchronized cycles.
- Independent pedestrian demand and optional vehicle-detection semi-actuation supported by configuration. For future fidelity, evaluate semi-actuated behavior and coordinated arterial groups against South African TMH16/SARTSM references rather than declaring the fixed pilot game timing legally compliant.

### 9.3 Long-term performance constraints

- Number of signal controller objects = approved enabled junctions, not full 121 unless later authorized.
- GLB network requests bounded by unique source type (at most two for the city), not head count. Pooled material variants for red/amber/green; thin instances of static housings and measured lens overlays.
- Use `north-heights-visibility-gate-015.ts` style camera-aware culling/LOD; logical phase accuracy persists outside visual range.
- Avoid 121 x nested CPU asset traversals at each frame: cache transformed placements, group visible heads, update phase-dependent matrices/material selections only on phase transition or visibility change.
- Ensure startup and memory budgets remain compatible with the accepted 125 cars, 100 pedestrians, trees, existing 359 lamps, interiors and glTF avatar. Compare before/after, not just absolute FPS.

---

## 10. Deterministic contract, telemetry and quality gates

### 10.1 Pure controller tests

- 20Hz tick → exact phase transitions and colour invariants; paused/restarted controller does not advance against wall clock.
- Vehicle phase sequence never admits conflicting NS/EW connectors; exactly one phase state owns an approach at any tick.
- Red cannot newly admit an autonomous car; amber safe-stop behavior matches speed, approach distance and braking.
- All-red/clearance remains until prior legitimately committed connector owners are clear; stale orphan reservations are repaired without ghosting.
- Pedestrian WALK demand is served; no entry outside WALK and no premature car green while a crossing body remains.
- Deterministic state snapshots same seed/tick, no `Date.now` drift.
- Disabled nodes follow the original traffic solver with unchanged all-way-stop and collision semantics.

### 10.2 Topology and placement tests

- Exactly one enabled signal: `NH012:N:6:4`; all remaining 120 junctions have zero active traffic controllers and no new rendered signal heads.
- Pilot centre exactly `(64,-64)`, closer to entrance `(46.002,-77.2355)` than any other grid node.
- Incoming lane directions map to the correct traffic-light faces; no mirrored lens orientation.
- Asset placement footprints do not collide with static buildings, lamp-pole avoidance zones, playable doorways, zebra paint, curb returns, Reese walking path or traffic swept hull.
- The approved crossing allocation generates both pedestrian route edge(s) and matching zebra paint with actual matching endpoints.
- No support straddles road lanes; overhead arm has sufficient height for accepted Sedan hull and camera perspective.

### 10.3 Vehicle + mission integration tests

- 125-agent seeded simulation, sustained 20Hz replay; at pilot red cars stop **with their front bumper before zebra**; green progresses without a mandatory four-tick stop if downstream lane is genuinely free.
- Test cars arriving just before amber, during amber, and already within the connector when red begins.
- No road-to-road overlap, missing reservation, illegal red civilian admission, stranded legal queue or blocked crosswalk when space is available.
- Cycle through several signal phases including on-demand pedestrian crossing; evaluate queues stopped in 30s windows and p95 wait time, moving agent count, throughput and spillback to adjacent intersections.
- Manual drive through red remains physically governed but not automatically seized from the player; driver exit and manual↔auto handback safe.
- Finch route, parked yellow starter, Diane tailing drive/meeting, mission reset, elevator/camera/mini-map unaffected.
- Pause/return/refresh and stored local resume do not start phases out of sync or overwrite traffic saves.

### 10.4 Rendering and acceptance evidence

- Asset audit snapshots with bounding sizes, lens names, chosen mounting method and direction.
- One pilot junction from **all four approaches**, by day/dusk/night; red/amber/green and pedestrians illustrated in short videos/stills.
- GLB requests and total bytes, mesh count, thin instances, material allocations, draw calls, peak GPU/CPU, p95 frame duration, first-playable time.
- Demonstrate a car braking at red and advancing on green with a following queue; demonstrate crossing WALK and WAIT with at least one NPC.
- Verify city elsewhere still operates under pre-existing unsignalized controls.
- Build must pass `npx tsc --noEmit`, `npx vitest run`, repository wheel/prebuild pipeline and `npm run build` (as applicable to project's deploy script); do not disable failing tests.
- No acceptance based solely on a deployment showing READY; live motion and signal permissions must be visually tested.

### 10.5 Debugging/observability (no HUD clutter)

Opt-in dev snapshots:
```text
pilotNode, tick, phase, ticksRemaining,
NS/EW approach queue lengths, lastAdmittedVehicleId,
reservationOwner, blockedExitReason,
pedestrianRequestPending, crossingOccupiedCount,
newRedEntries, conflictingPermissions, activeGLBInstances
```
No always-visible modal or telemetry export button. A failure should be diagnosable by a structured console snapshot or existing approved diagnostics rather than manual speculation about red-light congestion.

---

## 11. Proposed implementation sequence and owner gates

| Work package | Stage | Deliverable | Acceptance gate |
|---|---|---|---|
| POI-011-00 | Source audit | Verify BOTH GLBs, lens/material nodes, dimensions, performance, installation suitability | Owner chooses accepted rendering approach/model(s) from an actual preview |
| POI-011-01 | Site + classification | Confirm Civic Avenue × Commerce Way, obstacles and approach positions | One-junction footprint signed off; all other junctions untouched |
| POI-011-02 | Pure controller | Tick-driven NS/EW/amber/clearance/ped phases and invariant tests | Pure tests pass, never conflicting green |
| POI-011-03 | Car compliance | Brake before red, amber/green clearance, connector reservation, physical collisions | 125-car replay and Finch/Diane regression |
| POI-011-04 | Crosswalk and NPCs | Add canonical pilot zebra, graph links, crossing permission and occupancy | Pedestrians wait/enter/clear safely; no blockage |
| POI-011-05 | Visual GLB installation | Actual asset on functional supports, correct orientation and lens-state emittance | Four-view day/night video/screenshots, no pole overlap |
| POI-011-06 | Integrated pilot QA | One signalized junction, traffic queues, 20Hz determinism, performance, preview deployment | Owner reviews pilot; **no citywide expansion yet** |
| POI-011-07 | Future rollout design | Corridor ranking/classification, demand/adaptive timing, progressive LOD | Document only, separate citywide approval required |

Implementation branch is created **only after the owner explicitly authorizes the pilot implementation**. Each work package should have a reversible commit; report exact build/preview URL after initiated. Owner-supplied GLBs remain in the repository and are never deleted during a failed trial.

**Future citywide rollout requires a separate, explicit owner instruction after the one-junction pilot is accepted.** This plan provides the architecture and testing strategy now, but does not grant permission to populate North Heights with traffic lights.

---

## 12. Risks, failure modes, recovery and rollback

| Risk | Failure signature | Prevention / rollback |
|---|---|---|
| GLB not separable into lenses | Entire housing glows or lens colours appear wrong | Asset manifest first; calibrated small overlays with owner approval; keep source GLB unchanged |
| Wrong facing/scale | Back-facing lights, hovering heads, poles in road | Actual vertex normalization, per-approach heading and scene screenshots; revert renderer placement |
| Signal without admission integration | Cars stop at green or drive through red | Single phase state injected into NH012, deterministic event trace; disable pilot signal and restore unsignalized mode |
| Red queues blocking crosswalk | Car nose extends into zebra | Front-bumper stop datum based on hull, not graph-node centre |
| Transition introduces collision | Opposing greens while old connector occupied | Clearance waits for swept hull exit and safe reservation ownership |
| Pedestrian deadlock | NPC waits on zebra while car waits, permanent all-red | Entry permission at sidewalk, occupancy tracking, bounded diagnostics; no forced passage |
| Mission regression | Diane stops permanently, Finch navigation fails | Dedicated scripted-route tests; targeted AI still obeys admission while manual retains owner control |
| Added load / FPS regression | 1.12 MB downloaded eagerly or 121 GLB copies | Lazy source load, unique asset cache, thin instances, visibility gate, compare first-playable |
| Citywide unintended rollout | All 121 junctions receive lights on one merge | Single `enabled:true` pilot config and automated assertion that 120 remain disabled |
| Unreliable persistence | Refresh changes phase unpredictably mid-crossing | Restore tick/phase atomically, or safely restart pilot at all-red with ownership resolution |

**Rollback default:** disable `NH012:N:6:4` signal in the registry, remove pilot GLB instances/collision pole registrations and pilot crossing-gate override (retaining the base zebra if separately accepted). Unsignalized junction code must stay intact so a revert does not require reinstalling old AI.

---

## 13. Optional engineering references (informational, not proof of SA compliance)

- South African Road Traffic Signs Manuals (official manual index / SARTSMA): https://www.sartsma.co.za/saroadsignsmanuals
- South African Department of Transport, TMH16 Volume 2, section 8.14: https://www.transport.gov.za/wp-content/uploads/2023/02/TMH16-TIA-Vol2.pdf — discusses SARTSM Volume 3, approach visibility, semi-actuation, overhead signals and corridor coordination.
- FHWA Traffic Signal Timing Manual, chapter 5: https://ops.fhwa.dot.gov/publications/fhwahop08024/chapter5.htm — phase, yellow/clearance and pedestrian interval modeling concepts.

The fictional game may use simplified intervals for performance and usability. Do not claim that pilot trial values satisfy real-world regulatory timings without formal engineering evaluation.

---

## 14. Explicit status and authorization checkpoint

- **Document:** citywide-comprehensive technical architecture with exactly one Finch HQ pilot.
- **Owner-approved principle:** signalized major/selected junctions, not all 121 by default.
- **Owner-requested immediate focus:** the **single nearest junction to Finch HQ** at `NH012:N:6:4`.
- **Pilot implementation:** **AUTHORIZED**. Owner explicitly instructed: “Fullplan authorized, merge and deploy.”
- **Citywide physical deployment:** **NOT AUTHORIZED**; separate future gate even after pilot succeeds.
- **Source code changed by drafting this plan:** initially no; subsequent implementation is committed to the POI-011 feature branch.
- **Asset files modified:** **no**.
- **Deployment initiated:** pending final code review and merge at the time of this implementation record.

---

## 15. Implementation record — owner authorization, 2026-11-04

Owner instruction: **“Fullplan authorized, merge and deploy.”** In the prior exchange, owner fixed the boundary as **“one junction, nearest to Finch HQ”**. Accordingly the pilot is implemented for `NH012:N:6:4` only, with no expansion to the other 120 nodes.

**Working branch:** `feature/poi-011-finch-traffic-signal-pilot-20261104`, forked from `main` at `2a25bbc`.

**Source files implemented:**
- `nh021-traffic-signal-plan.ts`: canonical one-junction pilot, future citywide typed plan and crossing-edge identity.
- `nh021-movement-conflict-matrix.ts`: directed vehicle approach classification and permission checks.
- `nh021-traffic-signal-controller.ts`: tick-driven NS/EW green, amber, all-red clearance, on-demand pedestrian WALK and crossing-clearance states. The phase controller runs at the same 20Hz as NH012.
- `nh012-traffic-simulator.ts`: pilot-only admission, approach braking before crosswalk, conservative exclusive junction reservation, checked downstream exits and manual driver ownership. Unsignalized junction logic otherwise remains in place.
- `north-heights-pedestrian-simulator-001.ts`: pilot crossing-entry gate with occupancy count; existing crossing NPCs continue through clearance.
- `north-heights-pedestrian-crossings-001.ts`: **only** adds `6,4` to the shared crossing allocation. This produces the existing system's east/north zebra edges and matching paint, not four unverified zebra approaches.
- `north-heights-roads-003.ts`: four visible pilot approach stop bars, with no changes to the other 120 junctions' stop-line geometry.
- `north-heights-traffic-signal-placements-021.ts`: exactly four signal heads oriented from actual NH012 incoming lanes — **two hanging NS heads** and **two roadside EW heads**. No doubled pole at a single approach.
- `north-heights-traffic-signal-renderer-021.ts`: import BOTH owner-provided GLBs once, inspect native geometry/material names/units at runtime, normalize model coordinates, batch head meshes through thin instancing, derive authored lens centres by mesh/material names when identifiable and use a logged measured-bounds fallback otherwise. Procedural common materials emit red, amber and green; small synchronized pedestrian WALK/WAIT indications are visible at the two pilot crossing approaches.
- `north-heights-city-8.ts`: defer optional GLB imports until after the first playable frame, then activate traffic and pedestrian signal policies only when rendering has successfully loaded; on asset failure automatically retain the pre-existing all-way stop to prevent invisible reds.
- `nh-solid-vehicle-collision-017.ts`: register the four physical signal pole positions only after the renderer loads; register corresponding Rapier fixed collision supports for Reese.
- Tests: `poi011-finch-signal-controller.test.ts` (phase safety, pilot geometry, crossing, unchanged unsignalized traffic), `poi011-owner-traffic-light-glbs.test.ts` (actual binary GLB header, version, mesh and material manifest output).

**Known qualification limitation:** The connected GitHub binary-file tool could not decode the two GLB files for direct visual inspection during authoring. Source paths and byte sizes are verified by the Git tree, but authored lens offsets and orientation are inferred dynamically by the runtime GLB decoder; they still require owner preview/playtest acceptance. The source GLBs were not altered. Do not claim visual geometry or red/green lens behaviour fully accepted without a live game screenshot.

**Safety/fallback:** One pilot only; conservative exclusive connector ownership; no ghosting or forced cars. Both source models must load before the controller activates. If import fails, all normal all-way-stop semantics continue with an explicit console error. All other city junctions remain unsignalized. No auto-enabled future rollout.

**Build status:** Local full repository clone and Vercel test execution were not possible in this authoring sandbox. The dedicated test files are committed but their execution results remain unverified until a build is performed. User requested production merge/deploy after implementation, not background log monitoring. Once the production URL is available, report it and do not monitor logs unless the owner reports a failure.

**Owner acceptance check:** Verify red stopped vehicles with bumpers behind visible stop bars; green vehicles move with existing collision safety, amber/clearance transitions, both owner models appear at the Finch junction facing oncoming cars, NPCs wait for protected WALK and cross without cars entering, and no new heads appear at the other 120 intersections.
