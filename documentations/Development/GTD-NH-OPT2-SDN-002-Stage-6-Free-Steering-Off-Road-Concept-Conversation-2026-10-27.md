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

## Owner decisions — environment collisions and North Heights loading (2026-10-27)

**Owner's explicit direction:** “Yes, free driving in Stage 6 should allow basic physics, going through walls is strictly prohibited whilst trees, lamps and other cars are forgivable. The objective here is free driving. Note: there is no need to render those 6 GLB cars in the parking lot. Drop them from loading in North Heights at all after finishing stage 6.”

### Confirmed environment and collision rules

- The Stage 6 player-operated moving Sedan must support **independent continuous free steering and driving off-road**; it is no longer confined to NH-012 road, lane, turn-zone or junction geometry.
- **Buildings, structural walls and other solid building envelopes are mandatory hard obstacles.** No driving through walls or buildings. Implement actual world-space vehicle-footprint collision resolution, not merely a stop based on a point at the vehicle's centre. Use continuous/swept or bounded-substep motion so a fast vehicle cannot tunnel through wall colliders. Contact response should stop/slide the Sedan without teleporting through structures.
- **Ground contact is mandatory:** use the actual North Heights ground surface and support height when traversing roads, pavements, grass and off-road terrain. Define basic pitch/roll/slope handling and avoid falling below the map, floating, or visibly penetrating terrain. No new unconstrained full rigid-body physics is automatically implied by “basic physics.”
- **Trees, lamp posts and other vehicles are currently forgivable/optional colliders.** For the first Stage 6 prototype they may remain **pass-through**, as in Stage 5, rather than blocking free-driving progress. No claim of completed tree/lamp/car collision handling. They must not accidentally act as hard stop barriers if collision was not intentionally enabled.
- Other autonomous NH-012 cars should retain their routes, traffic permissions, simulation rate, body/wheel rendering and independent movements **undisturbed**. The manual vehicle may overlap their positions during this trial; visual overlap is intentionally tolerated pending a separate vehicle-collision milestone.
- Previous Stage 5 acceleration (2.6 m/s²) and forward speed (10.4 m/s), reverse and throttle/brake intent remain the provisional control baseline unless changed by the owner.

### Six parked GLBs — explicitly deferred removal from *North Heights loading*

- **At the conclusion of a successfully implemented Stage 6, remove the six default parked GLB vehicles from North Heights loading entirely.** They are not needed for Stage 6 acceptance, and their former parking locations may remain empty.
- This means no six-vehicle runtime asset import/preload, Babylon mesh instantiation, native wheel-rig preparation, parked vehicle physics actor/collider creation, parking validation tied to the six loaded vehicles, or UI boarding/driving lookup in the **North Heights** runtime.
- The current code uses `MERCER_EXTRA_GLB_SPECS`, `createMercerExtraParkedGLBs`, `FirstDriveTrial`, `createMercerExtraParkedGLBs`'s imports and `cars` collections in `src/game/experiments/north-heights-city-8.ts`. Audit and remove their **North Heights runtime use/dependency path** after Stage 6 free-driving implementation and verification, with a loading/asset request regression check.
- **Do not delete shared GLB asset files or alter other districts** merely to reduce North Heights startup. Do not remove or disturb the independently simulated **125 moving traffic vehicles**, accepted source-native traffic Sedans or Voight.
- **Timing:** The owner said “after finishing stage 6.” Record this removal as part of Stage 6 completion/closeout; do **not** make the parked fleet vanish during the present design discussion.

### Implementation gate

These are accepted **requirements and timing decisions**, **not authorization to start Stage 6 coding**. The owner explicitly specified that Stage 6 is still in the conversational phase. No feature logic, traffic physics, car loading, production merge or preview changes in this documentation-only update.

## Questions to resolve conversationally

1. **Steering model:** Continuous hold-to-steer with gradual yaw/turning radius versus instantaneous direction change; speed-sensitive turning and reversed steering when moving backward.
2. **Environment physics — partially resolved:** Buildings/walls must block, ground contact is mandatory, and trees/lamps/other cars may be pass-through. Decide detailed collision response (stop, slide, bounce) and acceptable terrain slope/curb thresholds.
3. **Driving boundaries:** Is off-road movement confined to the current North Heights world map bounds? What happens at the physical edge?
4. **Autopilot re-entry:** At what point can a freely parked/off-road Sedan return to the NH-012 lane graph—only when on a valid carriageway and correctly heading into a lane, or by explicit nearest-safe-lane transition?
5. **Vehicle overlap — partially resolved:** Player may pass through other cars; specify how the autonomous traffic graph handles the selected player-owned traffic identity without allowing AI routing/reservations to be disrupted.
6. **Controls and camera:** Desktop Arrow/WASD, mobile hold buttons, camera heading consistency, acceleration and steering during reverse, and the manual/autopilot toggle.
7. **Acceptance proof:** Continuous free steering on a straight road, cross-lane/off-road traversal, reverse, terrain support, **impermeable buildings/walls at full manual speed**, third-person camera, unchanged 124 AI cars, accepted native materials/wheels, performance and test coverage. After Stage 6 implementation, verify six parked GLB assets are no longer requested/instantiated by North Heights.

## Explicit nonauthorization

This discussion file is **not** an approved technical implementation plan. No Stage 6 gameplay, collision changes, new actors, branch merges or deployments are authorized by the current owner message. Continue architecture conversation and obtain explicit implementation authorization later.

**Stage 5 accepted. Stage 6 unimplemented, exploratory.**
