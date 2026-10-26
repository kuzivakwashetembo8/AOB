# NH-016 — Complete North Heights vehicle traffic circuit, remove dots
Date: 2026-10-26
Branch: feature/nh-016-full-fleet-no-dots
Status: implementation, automated build and owner preview gate; NOT merged to main.

## Source of truth and inventory
- NH-012 continues to own all 125 deterministic microscopic traffic agents (20 Hz, directed edges, stop priorities, turns, collision-safe longitudinal spacings). No additional routes, Rapier bodies or separate AI.
- Accepted NH-013/014/015: 8 original sedans, 12 original hatchbacks, 8 taxis, 6 Renault Kangoo = 34.
- 91 pre-existing agents are already assigned across the six original car types in NH-012. They need VISUAL onboarding, not extra logical cars.
- These are exactly the six physically parked/drivable North Heights native owner GLB models: Range Rover Sport 2018, Toyota Hilux 002, Land Rover Defender 001, Dodge HP, BMW M4 Competition, Lamborghini Temerario.
- These 91 keep their source IDs, five-paint-class distribution, speed, route, lane, stop decisions, and owner-selected appearance variant (paint tracked on 3D LOD). Six parked originals and their drivable actors remain independent and untouched.

## Rendering decision and constrained browser budget
- Do not instantiate 91 (or 125) complete GLB model hierarchies. Some optimized owner files retain very high triangle counts. Mobile performance cannot support full 3D hierarchy, multiple shadows and dozens of independent materials for every traffic agent.
- NH-016 establishes a 3D fallback representation for ALL 125 logical agents, rather than invisible cars or coloured sphere dots. Batched Babylon thin-instance geometry uses size/class-matched SUV, pickup, offroader, muscle, coupe, supercar, sedan, hatchback, taxi and Kangoo cabin/bonnet/wheel silhouettes. Five-paint-class authored traffic paint IDs map to distinct body material colours. GLB authenticity applies only to camera-near source models; fallback is intentionally simplified, not falsely described as source polygons.
- Each low-detail vehicle contains identifiable 3D windows, front/rear lights, four separate black cylindrical tyres plus metallic rims. All four wheels roll by actual agent displacement; front tyres steer based on NH-013 traffic connector curvature; road plane is fitted to the four tyre footprints via NH-013 four-point grade contact.
- A single per-material thin-instance mesh drives many cars, with bounded static buffers, no per-agent meshes, and zero traffic dot meshes. All 125 logical cars can be visually present in the same scene without 125 complete imported GLBs. Near authentic models hide only their own lower-detail silhouette; no double-render.
- At camera range 88m desktop / 58m mobile, upgrade at most one original glTF instance of each of the six default vehicle types, maximum six detailed traffic models desktop / three mobile. Load one same-origin owner source asset at a time; reuse model containers; at most one new detailed instance per frame.
- Use the exact original parking/vehicle asset paths and source->world fitting. The four MVRS build-time wheel derivatives are the same owner originals already used by accepted drivable cars; Range Rover and Lamborghini use their already-authored separate wheel hierarchies. Successful original-wheel qualification is mandatory for a GLB detail upgrade; otherwise the four-wheeled 3D silhouette stays visible and error is reported. Wheels are advanced per NH-012 tick, front steer persists between frames, terrain contact shares NH-013. No fabricated wheels are added to actual GLBs.

## Scope and file map
- New src/game/traffic/nh016-fleet-manifest.ts: six source IDs, distinct types and paint aliases; fail-closed invariant exactly 91 pre-existing default agents and 125 total.
- New src/game/experiments/north-heights-traffic-3d-016.ts: 125-vehicle thin-instance 3D replacement for dots, including paint, wheel spin, steering and four-contact road grade.
- New src/game/experiments/north-heights-authentic-fleet-016.ts: six original-model renderer with reuse, visibility bound, memory cap and source-wheel qualification.
- src/game/experiments/north-heights-city-8.ts: traffic updates use existing NH-013/014/015 renderers plus NH-016 source and 3D fallback. Completely remove createNorthHeightsTrafficDots012, dot update and dot disposal from scene. No mutation to previous representation classes or any other city gameplay.
- New src/test/nh016-full-fleet-no-dots.test.ts: verify composition, colour families, six unique types, source wheel rig reuse, no dot mesh creation in scene and deterministic 360-tick replay.

## Acceptance and limitations
- Owner should check all six types are represented on roads, recognizability at flight altitude and at close-up, full forward movement, four-wheel rolling, front turning and hillside tyres; compare FPS/memory on Android and desktop. GLB source upgrades can fail closed to recognizable 3D LOD, never to dots; inspect console and status for warnings.
- The existing four accepted traffic types also fallback to 3D silhouettes while their original GLB loads; 125 vehicles exist at all times. Original model materials and showroom parked cars are not modified.
- Long-range thin-instance 3D LODs are generated silhouettes, not a geometric decimation of the owner sources. If full source-authentic long-distance models are required, create a separately approved offline per-model true-source LOD pipeline.

## Safety & release
All assets are same-origin, no external APIs or telemetry changes. New bounded per-type source cache and GPU thin-instance memory. Graceful fallback after GLB source/wheel validation failure. Preview only; do not merge/deploy production until owner accepts.
