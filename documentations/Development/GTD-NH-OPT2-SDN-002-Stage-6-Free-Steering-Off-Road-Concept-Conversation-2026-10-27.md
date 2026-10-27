# GTD-NH-OPT2-SDN-002 — Stage 6 Free Steering, Lane Departure and Off-Road Driving

**Date:** 2026-10-27  
**Status:** **CONVERSATION / REQUIREMENTS DISCOVERY ONLY — NOT APPROVED TO IMPLEMENT**  
**Predecessor:** GTD-NH-OPT2-SDN-001 Stage 5 — **completed and accepted**  
**Working branch:** `feature/north-heights-optimization-2-20261027`  
**Owner's controlling instruction:** “Document stage completion, stage 6 is still conversing stage.”

## Stated direction (owner language)

“Stage 6 will now allow premature turning into other lanes including off-road driving, a full deviation from traffic rules whilst other cars continue with their system undisturbed.”

This is the **conceptual intention** for Stage 6, not a completed solution or technical authorization.

## Proposed gameplay outcomes under discussion

- Left/Right would no longer mean “select a predefined intersection connector.” Holding steering could alter chassis heading at any place, including the middle of a long straight road.
- A manual Sedan could leave its assigned lane, traverse another lane, cross the road edge and enter available off-road terrain. The **player-operated** Sedan would not be snapped back to an NH-012 edge or restricted to a junction control zone.
- Forward/Reverse/Brake would remain responsive and keep the accepted Stage 5 speed/acceleration baseline unless later revised by the owner.
- Other traffic agents (125 total including the temporarily player-operated identity) continue autonomous pathfinding, reservations, collision-avoidance assumptions, original source-native rendering and performance boundaries **unchanged**. Taking over a single car must not redirect other traffic; the return-to-autopilot contract will need an explicit design.
- The accepted Stage 5 experimental car-to-car pass-through policy is the provisional baseline while the separate vehicle collision system is absent, unless the owner directs otherwise.
- Third-person camera, accepted Sedan GLB/thin-instance appearance and wheel transforms should not regress.

## Necessary technical separation — not yet designed

Stage 5 can use scalar progress `s` over a `TrafficEdge012` or `TrafficConnector012` because the Sedan never leaves its road centerline. Stage 6 **cannot** retain that scalar as the sole authoritative position once arbitrary steering and off-road motion are permitted. A suitable design will need independent continuous world pose/heading and motion state for the single manually operated agent, with an explicit and testable reconnection rule when returning to autonomous traffic.

Do **not** unconditionally project the manual pose onto a nearby lane every frame: that would erase the defining feature of Stage 6. Do **not** add a duplicate high-polygon vehicle model/rig or release the accepted native wheel/source meshes into an unvalidated replacement chassis.

## Questions to resolve conversationally

1. **Steering model:** Continuous hold-to-steer with gradual yaw/turning radius versus instantaneous direction change; speed-sensitive turning and reversed steering when moving backward.
2. **Terrain and solid obstacles:** Should off-road driving respect North Heights ground height, slope and curb geometry? Should buildings/walls remain solid, or also be temporarily pass-through as cars are?
3. **Driving boundaries:** Is off-road movement confined to the current North Heights world map bounds? What happens at the physical edge?
4. **Autopilot re-entry:** At what point can a freely parked/off-road Sedan return to the NH-012 lane graph—only when on a valid carriageway and correctly heading into a lane, or by explicit nearest-safe-lane transition?
5. **Vehicle overlap:** Keep current pass-through with other traffic during tests, but decide how that affects the autonomous traffic follower whose simulated lane occupant is under manual player ownership.
6. **Controls and camera:** Desktop Arrow/WASD, mobile hold buttons, camera heading consistency, acceleration and steering during reverse, and the manual/autopilot toggle.
7. **Acceptance proof:** Continuous free steering on a straight road, cross-lane/off-road traversal, reverse, ground contact and third-person camera, unchanged 124 AI cars, vehicle identity and native material/wheel preservation, performance and test coverage.

## Explicit nonauthorization

This discussion file is **not** an approved technical implementation plan. No Stage 6 gameplay, collision changes, new actors, branch merges or deployments are authorized by the current owner message. Continue architecture conversation and obtain explicit implementation authorization later.

**Stage 5 accepted. Stage 6 unimplemented, exploratory.**
