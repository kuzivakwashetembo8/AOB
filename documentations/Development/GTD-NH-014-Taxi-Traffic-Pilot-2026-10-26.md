# GTD-NH-014 — Original Taxi.glb traffic onboarding (G1)
Date: 2026-10-26
Status: preview implementation; owner visual acceptance pending.
Branch: feature/nh-014-taxi-traffic-pilot

## Mission
Onboard the committed Taxi.glb **before Renault** and **before the original six drivable models** join rendered ambient traffic. Do not modify main or create an independent traffic simulator.

## Verified source GLB inspection
- Original: public/GLBs/Cars/Taxi.glb, 746,748 bytes, 47 source nodes, 29 meshes, ~19,916 triangles.
- Dedicated body material and taxiSign/taxiSignGlass materials exist. Preserve original livery, glass, rubber, rim surfaces, headlights, taxi sign and source texture slots. No speculative recolouring.
- Four distinct original wheel transform nodes with attached real mesh geometry:
  - Front-left lgnWFL_1 at (-0.6615,0.3608,-1.3374)
  - Front-right lgnWFR_9 at (+0.6515,0.3608,-1.3374)
  - Rear-left lgnWRL_8 at (-0.6615,0.3608,+1.5277)
  - Rear-right lgnWRR_10 at (+0.6515,0.3608,+1.5277)
- Authored front is negative source Z, source wheelbase ~2.865m and true wheel diameter ~0.72m. Source left hubs have half-turn Y rotations unlike right; the WHEEL-001 compliant wrapper adds a neutral pivot at each genuine wheel's existing position while preserving original wheel geometry/orientation. Shared StreetVehicleWheelRig rolls all and world-yaw steers front two only.
- Babylon glTF coordinate conversion is expected to orient negative source Z toward positive displayed Z. The visual heading correction is provisionally zero. **Bonnet orientation must be inspected in actual preview**; if incorrect, adjust the **visual root only**, not NH-012 traffic heading.

## Logic / visual bridge
- Preserve 125 original NH-012 20Hz autonomous traffic entities. Deterministically reassign eight closest otherwise-unassigned agents to source taxi identity: sedan 8 + hatchback 12 + taxi 8 + diagnostic dots 97.
- No changes to NH-012 routing, intersection decisions, lane support or collision model. The six parked/drivable owner cars remain unchanged.
- Source taxi AssetContainer is loaded once and instantiated at most once per frame, near camera (425m horizontal range), reverting to moving diagnostic dots until ready. Its ~20k triangles mean a three-LOD build is not necessary for this limited preview. Revisit if profiling warrants it.
- Road-grade fit uses existing NH-013 four-tyre contact pose. World-up toe comes from existing connector curvature logic and 20Hz NH-012 ticks. All four authentic wheels roll, front two steer, rear two do not steer.
- Missing source or incomplete wheels fail closed to a diagnostic dot, logged in the traffic telemetry; no procedural/placeholder substitute.

## Acceptance checklist
1. Taxi appears along existing roads rather than a static spawn; no sedan/hatchback regression, no new dots/traffic AI, diagnostic tally 97.
2. Bonnet and taxi sign align with direction of travel; no backward sliding.
3. All four original wheels animate rolling; two fronts visibly steer at junctions; no detachment, floating or asphalt penetration on North Heights inclines.
4. Taxi recognizably retains source colours/sign and surfaces. Voight can find it from elevated flight POV (425m). Verify performance, mobile touch controls, 125-agent determinism and six drivable parked vehicles.
5. Run build, tests, preview deployment and collect owner screenshots. Green CI or READY is *not* visual signoff.

## SEC-CHECK
All assets are project-local, no new external fetchers or telemetry. The renderer only observes NH-012 and creates no Rapier traffic colliders; avoid claiming physical traffic collision protection. One source container, eight visible original models maximum, with disposal on teardown. Preview branch only; no merge or production deployment without owner approval.

## Next gate
After this taxi preview is accepted, independently audit/onboard Renault Kango Optimized.glb against the original. Only then consider the six default vehicles' traffic visualization. 
