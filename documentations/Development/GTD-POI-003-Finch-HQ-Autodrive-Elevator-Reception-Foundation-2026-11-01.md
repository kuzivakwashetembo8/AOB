# GTD-POI-003 — Finch Headquarters Foundation: Targeted Auto-Drive, Elevator and Reception

**Date:** 2026-11-01  
**Branch:** `feature/finch-headquarters-map-20261101`  
**Parent decision:** [POI-002](./GTD-POI-002-Finch-Headquarters-Designation-and-Map-Landmark-2026-11-01.md) — eastern tower `NH-04-06-L2` (53 floors).  
**Status:** Implementation preview for owner acceptance. No merge or production deployment requested.

## Scope and user scenario

1. Enter an existing NH012 moving Sedan variant and expand the North Heights map. The gold `FINCH HQ` landmark is selectable **only as a destination**, not as a mission activation.
2. Clicking the marker while riding sets a **directed road-network target** for the *already occupied car*. It follows existing NH012 legal turns, traffic rules, collision policy and simulation/visual identity. The car slows to a full stop at the closest road segment's safe non-intersection stopping point opposite the headquarters doorway; car-body collision rules prevent direct entry into the building.
3. At the ground-floor headquarters lobby, an elevator cabin is constructed at the building edge using a wood/steel visual design inspired by the owner's reference image. Its sliding doors open when Voight approaches from the lobby, then close when he is fully inside or leaves the perimeter. Returning to the door from within the cabin reopens it. **No inter-floor elevator travel yet.**
4. A basic white reception desk and **one static receptionist NPC** are placed behind it. The NPC reuses the optimized `GTD_NPC_003` appearance through the existing canonical manifest, but is a **separate scene instance**, not a reassigned member of the 100 roaming civilian identities.

## Technical implementation boundaries

- `src/game/experiments/north-heights-finch-routing-003.ts`: finds safe nearest road approach to the `Finch HQ` doorway; breadth-first traversal of legal directed NH012 connectors; late-route loop if the starting car has already driven past the arrival point.
- `src/game/traffic/nh012-traffic-simulator.ts`: one optional targeted route on the existing selected agent. No duplicate Sedan, teleports, new dedicated Rapier vehicle or override of unrelated cars. Arrived vehicle brakes and holds for disembarkation. Existing manual driving cancels the destination; exiting returns the sedan to normal autonomous traffic.
- `src/ui/hud/north-heights-map-010.tsx`: accessible selectable marker on expanded map; stays informational on circular minimap. A non-riding player receives a prompt rather than routing.
- `src/routes/north-heights-preview.tsx`: connects the map selection to the active game controller; closes expanded map only when navigation is accepted.
- `src/game/experiments/north-heights-finch-lobby-003.ts`: isolated Babylon-generated lobby props; immediate meshes include a reception counter and animated two-panel elevator; one idle optimized NPC imported after gameplay readiness. Clean disposal on world exit.
- `src/game/experiments/north-heights-city-8.ts`: composes lobby and drives door animations from the actual on-foot player's Rapier position, not screen-distance estimates.

## Safety and acceptance criteria

- Driving to the entrance means reaching a **curbside road position for pedestrian exit**, not driving through the doorway. A car is not a pedestrian.
- No instant position jumps, off-road shortcuts through buildings, disabled collisions, or new initial loading dependence.
- Exactly one HQ map landmark: `NH-04-06-L2` only.
- Targeted route is cancelable by manual driving or exiting. If a vehicle cannot legally join the directed road network from off-road manual driving, route activation is rejected rather than teleporting it.
- The elevator is **ground-floor only** in this preview: the desk and cabin walls have static Rapier collision, and the sliding doors have a conditional collider when closed (automatically released as they open or if Voight occupies the threshold). There is no full-height shaft, no floor 53 teleport, and no upward ride. Those functions require a separately agreed stage.
- A receptionist is visible behind a white desk with an Idle animation if its GLB loads successfully; failure is logged and must not block game readiness. The desk and elevator walls are physically solid to the Rapier player capsule; moving doors add/release a collision panel based on their animation state.
- The remaining 51 floors remain undesigned and inaccessible, the existing tower exterior and 100 roaming identities unchanged.
- No mission assignment, Finch character spawn, dialogue or payphone behavior.
- Preview acceptance is required before merge/deployment to production.

## Deferred work

Enhanced elevator occupancy/interlock sequencing, two-way 53rd-floor transport, furnished upper-level Finch meeting room, actual `Finch.glb` staging, receptionist interaction, elevator sound, camera adaptation and mission flow remain separate upcoming milestones.

**Acceptance checklist:** Occupy a Sedan → expand map → click FINCH HQ → observe legal roads and automatic curbside stop → exit safely → enter HQ front opening → approach elevator (doors open) → step into cabin (doors close) → step back towards doors (open) → observe reception desk with idle character.
