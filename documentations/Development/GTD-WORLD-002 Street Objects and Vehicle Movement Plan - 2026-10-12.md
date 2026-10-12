# GTD-WORLD-002 — Street Objects and Vehicle Movement: Development Plan
**Date:** 2026-10-12 (SAST)  
**Status:** DOCUMENTED / PROPOSED; execution and deployment NOT authorized by this record.  
**Focus:** South Ward / Meridian City, currently playable First Light area.  
**Baseline reviewed:** GitHub `main` `7dd78c7e0a2dd691b8b530edb7638bf88b17bd36` (read at planning time).  
**Owner of creative/visual acceptance:** Project owner. **Implementation authority:** separate explicit greenlight.  

## 1. Outcome and decision

**Today's objective:** Make the inhabited city feel less like a static test environment by improving the credibility of **street-level objects** and beginning **actual car movement**. Work incrementally in the existing Meridian world. Do not attempt all of traffic AI, fully drivable vehicles or a district expansion at once.

**Player-visible acceptance:** A person walking in South Ward recognizes the purpose, placement and believable physical scale of street furniture/infrastructure; vehicles that move do so consistently with street topology, facing, motion, ground contact and nearby objects rather than sliding a parked mesh through scenery. Maintain the current credible buildings, imported cars, world lighting and humanoid movement.

This is a **new post-First Light development initiative**, not retroactive FL-4 work. FL-4 remains formally closed by user decision on 2026-10-11. The remaining Voight foot/curb penetration is carried forward as an independent GTD-CHAR-001 L3/L4 item, not silently repaired or claimed resolved here.

## 2. Source-of-truth reconciliation

Authority and scope, in order:

1. **Creative intent:** the connected Google Doc **Game Development** (read 2026-10-12): perceptual world, varied representation, city life, vehicle/pursuit potential and basic traffic; simulation belongs in the game runtime, not React; stable engine/physics foundations take priority over copying conventional game-engine structure.
2. **Runtime/technical boundaries:** [Meridian Game World Development — SOT](../Meridian%20Game%20World%20Development%20SOT.md): Babylon renderer, Rapier collision, fixed 60 Hz simulation, controlled scene ownership, future separate traffic/vehicles systems.
3. **First Light asset doctrine:** [Meridia: First Light Implementation Plan](../Meridia%20First%20Light%20Implementation%20Plan.md), §4 Street props and §5 Vehicles: true geometry where silhouette, collision, shadow or interaction warrants it; cars require true 3D models at gameplay distance; road/sidewalk/curb visual + physical coherence is mandatory.
4. **World authoring:** [Meridian City Generation Algorithm](../Meridian%20City%20Generation%20Algorithm%20-%20Five-Step%20Development%20Plan.md), Step 5 road graph, deterministic composition and stable object identifiers; [Dynamic Building Generation](../Meridian%20Dynamic%20Building%20Generation%20Algorithm.md), road-aware lot/frontage logic.
5. **Vehicle baseline:** [Imported Vehicle Benchmark](./Imported%20Vehicle%20Benchmark%20-%20Experimental%20Evidence%20to%20Development%20Acceptance.md) and FL-4 imported-only acceptance: do not revert to rejected toy/proxy cars on live gameplay. Existing externally sourced buggy and sports-car models are accepted **technical/development specimens**, **not licensed original GTD commercial assets**. First original target remains an ordinary four-door civilian/fleet sedan, not the demo Ferrari/buggy.
6. **Character dependency:** [GTD-CHAR-001 travel-facing plan](./GTD-CHAR-001%20Travel-Facing%20Locomotion%20and%20Foot%20IK%20Implementation%20Plan.md). Preserve current desktop-accepted heading and gait continuity. Mobile whole-character acceptance and animated shoe/curb interaction remain separate; moving-car collision should not be mistaken for a solution to foot IK.

**Scope reconciliation:** Historical First Light exclusions on city-wide moving traffic or a drivable-car requirement governed that *closed* milestone. They do not prohibit a new, separately authorized trial. Conversely, the high-level Google Doc's future drivable vehicle/traffic ambition does not mean either system already exists or is authorized for complete implementation today.

## 3. Verified current implementation (not proposed features)

| Area | Source-verified state as of planning |
| --- | --- |
| Street-context data | `src/game/world-generation/street-context.ts` deterministically places vegetation, streetlights, parked-car slots, bench and bin; these have stable IDs, positions, yaw and scale. |
| Street-object visuals | `street-context-renderer.ts` renders tree/shrub, streetlight, parked-car proxy comparison, bench and bin; accepted runtime parked slots normally show imported GLBs instead of rejected procedural vehicle visuals. |
| Static collision | `generated-first-light-world.ts` registers Rapier static colliders for parked cars, light poles, trees, benches and bins, with shrubs decorative. Current trials also establish raised-sidewalk support; no generic street-object interaction registry or traffic-motion system is demonstrated by these sources. |
| Streets | `first-light-spec.ts` contains a 2-lane, 8 m width road graph with Mercer Street, Workshop Road and Foundry Lane provisional labels and T-junctions. Road names are **not** established on physical signage yet. `road-graph.ts` contains topology, surfaces, junctions and projection helpers. |
| Vehicles | `gtd-runtime.ts` loads accepted buggy/sports GLBs into **parked static slots**; `generated-first-light-world.ts` replaces their static Rapier colliders after successful asset fit. No vehicle motion/steering, wheel physics, active driving or automatic traffic behavior is evidenced in the live core. `src/game/traffic/README.md` and `src/game/vehicles/README.md` are reserved shell boundaries, not simulations. |
| Lifecycle and release | Character/world startup witnesses and imported-vehicle readiness, pause/resume, graphics clarity, day/night lighting, real browser evidence and explicit GitHub/Vercel promotion remain protected. |

**Caution:** The current two imported specimens are technically useful, but asset redistribution, branding and commercial rights are unresolved. Use rights-cleared or explicitly authorized evaluation assets for any new motion trial. Do not describe an existing static imported mesh as a production-ready steerable/rigged vehicle without inspection of its wheel and hierarchy structure.

## 4. Workstream SO — Street objects

**SO-0 — Observe and inventory.** Capture current South Ward walking routes by daylight and night, including garage frontage, junctions, sidewalks, curb edges and pocket park. Export the actual deterministic IDs/positions and classify every present object as structural, functional, decorative or potential interactive. Identify clipping, grounding, scale, spacing, duplication, obstructed walk paths, missing believable street cues and night visibility. Distinguish visual defects from collider defects before patching.

**SO-1 — Define a small prioritized object set.** Start with improvement of **existing** streetlights, benches and bins (placement, proportions, contact, silhouette and material response) before expanding content. **Candidate additions**—subject to screenshot review and explicit selection—include road signs, bollards, drainage fixtures, traffic signal hardware, utility objects and modest surface litter/markings. Not all are required today; no large asset library or hand-placed district decoration.

**SO-2 — Deterministic object contracts.** Extend the existing `PropPlacementSpec` / street-context representation rather than introduce untracked Babylon meshes: stable ID, semantic kind, anchor (road/sidewalk/frontage/lot), transform, clearance, collision mode, material/LOD category, interaction affordance, day/night lighting relationship and provenance. Keep authored landmark objects distinct from seeded variation. Prevent placements across garage doors, curb cuts, crosswalks, junction mouths, vehicle travel lanes and essential pedestrian corridors.

**SO-3 — Render + physically integrate.** Use cheap, credible true geometry for silhouettes/interactive obstacles; texture/decal treatment for small, flat, noninteractive details. Match collider shape to physical extent without creating invisible barriers. Avoid accidental poles penetrating windows/curbs. Reuse existing streetlight environment timing rather than constructing parallel lighting controllers. Provide disposal and batching/instancing where measured benefit exists. No renderer-wide shader changes.

**SO acceptance:** In actual Meridian, objects make South Ward more legible and convincingly inhabited; Voight passes without trapping, ghost collisions, severe camera obstruction or repeated curb-contact regression. Night lighting, full-world visibility, pedestrian clearance, curb crossings and mobile cost are recorded. No acceptance solely from generated counts.

## 5. Workstream VM — Vehicle movement (separate from parked-car art)

**VM-0 — Decide first motion behavior from a real game comparison.** Define, then approve, which first trial we are observing: **A.** one or two *autonomous/script-guided road-following* vehicles; **B.** one *player-controlled drivable* car with entry/exit; or **C.** narrowly staged motion-first hybrid that tests wheels/steering/path following before either larger behavior. The roadmap supports all eventually, but they have different physics, input and testing costs. **Recommended first experiment: C with a bounded road-following demonstration**, then decide whether the next increment is ambient traffic or drivability. This is a recommendation, not an approved final vehicle-movement product requirement.

**VM-1 — Qualify motion-capable assets.** Inspect GLB origin, true forward axis, dimensions and wheel pivot hierarchy. Establish whether wheels are separately animated/steerable. If not, treat wheel animation as a separately measured editing requirement; never rotate all car meshes pretending to steer individual tires. Preserve the current accepted static parking assets untouched as comparison. Confirm permitted technical use/licensing of each trial asset, provenance and future replacement requirement.

**VM-2 — Establish a semantic lane/route contract.** Derive signed lane-center paths and travel direction from the existing road graph. Validate continuity at the T-junctions, turn radius, sidewalk/curb offset, intersection clearances, vehicle width, parking-slot separation and road mouth geometry before movement begins. Road graph connectivity alone is **not** a proven vehicle navigation or lane model. Use one named First Light test circuit, seeded/reproducible route state, and explicit safe boundaries/spawn and terminal behavior.

**VM-3 — Implement a single real moving vehicle.** Keep a vehicle actor and state machine owned by `GTDGameRuntime` / the reserved vehicle/traffic domain—not React, not an interpolated screenshot. Use fixed-tick position/heading, consistent orientation and wheel rotation synchronized to actual traveled distance, controlled acceleration/deceleration, turning geometry and visible stopping. Ground surface must match real road elevation. Start with a controllable **scripted/kinematic** trial only if its safety semantics are declared and tested; do not claim dynamic suspension, traction, collision damage, working AI, cruise traffic, or drivability from a scripted movement demonstration.

**VM-4 — Collision and coexistence.** Moving visual instance and its Rapier representation must have *one coherent owner*. Do not move a static collider every frame while treating it as traffic. Introduce appropriate kinematic/dynamic body or other validated collision-query mode; unregister/replace any original parked static collider when converting a slot to moving actor, avoid doubled invisible colliders, and preserve stationary imported parked cars elsewhere. Test collisions or stopping around Voight, other cars, trees/poles, curbs, building frontages and garage access. A nonphysical scripted route must be labeled as such and must not pass physical-interaction acceptance.

**VM-5 — Human-view realism and control of complexity.** Compare authored facing vs direction of travel, tire rolling, front-axle steering, turn path, acceleration/braking, nighttime visibility, shadow update and camera perspective. Player should see a vehicle *driving*, not a translated rigid display model. Progress to stop-sign/intersection behavior, multiple vehicles, avoidance, NPC traffic, pursuit, player driving and entry/exit only behind later explicit acceptance/authorization gates.

**VM acceptance:** A chosen real vehicle model moves along a real, visible street route without body-axis mismatch, tire sliding/hover, curb clipping, intersections cut-through, bad scale, inconsistent collisions, world startup interference or unacceptable device cost. If only script-guided movement is built, report **motion trial achieved**; do not claim “traffic system complete” or “drivable cars.”

## 6. Execution sequence and evidence gates

| Gate | Package | Required evidence | Status |
| --- | --- | --- | --- |
| G0 | Freeze current main behavior and snapshot routes | Current SHA, road graph/prop/vehicle inventory, mobile/desktop screenshots; explicit selected scope | NOT STARTED |
| G1 | SO-0/1 object audit + first visual treatment | Side-by-side same-camera daylight/night comparison; user picks high-value props | NOT STARTED |
| G2 | SO-2/3 data/render/collision candidate | Deterministic placements, Rapier physical/path clearance, scene/lighting/lifecycle tests, in-game screenshots | NOT STARTED |
| G3 | VM-0/1 motion mode and actual asset capability | Chosen vehicle-motion behavior, real asset hierarchy/wheel data, license/provenance and estimated scope | NOT STARTED |
| G4 | VM-2/3 one-vehicle street motion | Route/path, timed visual evidence, actor state telemetry, actual wheel/heading behavior | NOT STARTED |
| G5 | VM-4/5 physical coherence and whole-world regression | Voight/garage/props/car safety, no legacy collider duplicates, first-frame load, day/night, device measurements | NOT STARTED |
| G6 | Integrated user acceptance | User gameplay confirmation desktop + mobile, failure register, accepted defaults, documented deferrals | NOT STARTED |

G1–G3 discovery may run in parallel once contracts are clear; **G4 requires G3**, and release requires G5–G6. User-facing progress is the visible world, not the number of planning documents.

For each trial: record UTC + SAST timestamps where available, source and Vercel deployment SHA/URL, test controls, same-device viewport/quality, initial/cached load results, p50/p95 frame duration and frame gaps, draw calls/asset bytes if obtainable, lifecycle/disposal, collision anomalies, screenshot/video references, and an opt-in **real-data** diagnostic download if needed. Mark unavailable metrics unknown, never 0 or estimated PASS. Benchmark against the same untouched production baseline.

## 7. Non-negotiable regressions and release policy

- **World:** retain generated buildings, road markings, sidewalks/curbs, trees, garages, night sky, lighting and accepted high-quality imported static vehicles. Do not reintroduce the sky-and-cars-only rendering failure or loading-deadlock class.
- **Character:** preserve desktop-accepted L1 directional facing and L2 gait continuity, quality settings Apply & Resume, camera/touch controls; outstanding shoe/curb penetration stays tracked under GTD-CHAR-001 L3/L4.
- **Vehicles:** old six-mesh toy/proxy cars are not allowed as a default fallback in accepted gameplay. Loading or motion failure must be explicit, diagnostic and safe; do not silently show a different lower-quality vehicle.
- **Architecture:** no React frame simulation, giant traffic rewrite, speculative ECS migration, unmeasured worker cost, uncontrolled third-party asset dependencies or new district expansion.
- **Performance:** no fixed FPS/mobile-quality claim absent real measured evidence. Avoid hidden quality downgrades, whole-screen blur or full-height debug overlays.
- **Provenance:** no assertion of commercial rights for user-forked example cars; licensing clearance or replacement is a prerequisite to unrestricted commercial release.
- **Change control:** Implement on a dedicated GTD branch after authorization; validate TypeScript + tests + production build + actual browser/device evidence; merge and deploy only on explicit greenlight. A READY preview or PR merge is not proof of the canonical `/game` visual outcome.

## 8. Decision required before VM implementation

**Which car behavior should lead our first motion experiment—street traffic, player driving, or the bounded motion-first hybrid?** The technical plan recommends the hybrid because it yields immediate visible evidence and reusable road/vehicle dynamics without falsely declaring a traffic AI or playable driving system complete. We can settle that choice in conversation; no gameplay code is authorized by this document.

**Current checkpoint:** Documentation prepared and cross-referenced; all implementation gates remain NOT STARTED.
