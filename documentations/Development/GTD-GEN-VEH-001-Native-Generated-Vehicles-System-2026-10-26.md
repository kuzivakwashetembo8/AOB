# GTD-GEN-VEH-001 — Native GTD procedural vehicle system
Date: 2026-10-26
Branch: feature/gtd-generated-vehicles-001
Base: main@8955c7803f8090213bf41d8bbd6a5fa2de393b76
Status: implementation experiment; branch preview only, not approved for production

## Decision and intent
Author four reusable GTA-style car silhouettes directly as Babylon native geometry, based on the owner's supplied reference images: (1) yellow wedge supercar, (2) white four-door pickup, (3) lifted compact off-road SUV, (4) silver angular sedan/hatchback. These are DESIGN REFERENCES, not texture billboards or imported GLBs. Compare this native branch with NH-016 original-GLB production at the same camera, graphics settings, routes and seed.

## Boundaries
- Preserve NH-012 125 deterministic traffic agents, directed roads, route graph, speed/spacing/turn rules, parking geography, environment, walking/flying and collision physics.
- Traffic never requests a source GLB; no near-range async import, no LOD swap, no GLB cache thrashing.
- Construct native shared templates once; reuse Babylon meshes, source geometry and material variants; small batched thin-instance buffers hold the 125 moving agents. Four wheels per vehicle with rolling and steering visual transforms.
- Preserve the separately parked/drivable six owner GLBs in this first traffic-only performance experiment. They are a CONTROL: moving them or removing their colliders now changes two variables and makes comparisons inconclusive. Parking-lot GLB removal and generated parked drivables are the next separately reviewable patch AFTER owner preview acceptance. Do not silently disable boarding.
- The original GLB production version on main is the comparison branch; no second duplicate preview branch necessary. Both may be viewed independently.

## Ten archetypes; order and current scope
1 yellow sharp-wedge supercar (GEN-VEH-001).
2 white crew-cab pickup (GEN-VEH-001).
3 lifted compact off-road SUV with chunky wheels (GEN-VEH-001).
4 silver angular sedan / hatchback family (GEN-VEH-001).
5 full-size sedan (future detailing).
6 taxi sedan (future detailing).
7 Renault Kangoo-style utility van (future detailing).
8 coupe (future detailing).
9 muscle car (future detailing).
10 standard family SUV / crossover (future detailing).

Initial branch maps existing 10 traffic categories to a compact parameterized native body grammar: supercar, pickup, offroad, sedan/hatch, plus derivatives for all remaining categories. Distinct dimensions, paint IDs, roof/bonnet/wheel proportions and front/rear lights. These must read as vehicles from aerial and road camera, not primitive cubes or spheres. No external textures or vehicle assets required.

## Performance and integrity controls
- NH-012 remains 20Hz. Tick-driven transform uploads; do not upload every visual matrix when simulation tick is unchanged unless camera/LOD truly requires it.
- Shared materials, static mesh templates, bounded thin instances for paint variation, no per-agent dynamic rigidbody, texture fetch or shadow caster.
- No GLB import or GLB detail substitution anywhere on moving traffic. Report GEN native count 125 / moving GLB 0 / dots 0.
- Per-instance wheel articulation preserving road contact via existing NH-013 four-contact grade solver, and NH-013 curve steering.
- Measure FPS and p95 frame time / long-frame count on mobile and desktop under comparable settings; avoid claiming a win from code inspection alone.
- Fail closed to a native car template on an unrecognized visual category rather than a dot.

## First preview gate
1 Native vehicles are visible from aerial fly and street camera. First four silhouettes visually distinguishable and correctly oriented.
2 125 traffic identities persist; NH-012 seed/routes/priority unchanged.
3 All four tyres visually roll and front tyres steer, and wheel contact remains sensible on hills.
4 Walking, flying, mobile controls, parked-drivable originals unaffected.
5 Performance at least no worse than NH-016 on the same Android phone and comparison course, with fewer hitches upon approaching traffic.
6 Branch gets tests, preview deployment URL and owner screenshots. Do NOT merge to main until visual/performance acceptance.

## Follow-up gate — parking lots
Once traffic preview is accepted, develop separate changes on this branch or a follow-up feature branch to replace six parked/drivable GLB visuals with author-defined native generated cars, preserving Rapier actors, wheel collider dimensions, F/E entry, parking bay positions and interior behavior. This is intentionally excluded from the initial A/B render test.