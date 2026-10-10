# FL4-VIS-C03 — Vehicle Proxy Regression Contract

**Status:** SPECIFIED, NOT EXECUTED. This is a future test checklist, not evidence of passing tests.

| ID | Assertion |
| --- | --- |
| CAR-01 | Deterministic car IDs, placement, yaw, scale and geometry |
| CAR-02 | Body stays within original Rapier collider dimensions |
| CAR-03 | Four original wheels retain track, wheelbase and size |
| CAR-04 | Six meshes per car and three shared materials |
| CAR-05 | Front/rear windscreens, two side panes each side, hood, roof and trunk |
| CAR-06 | Finite vertex coordinates, valid indices and correct face orientation |
| CAR-07 | Active generated renderer uses the geometry, not authored fallback |
| CAR-08 | Static collider center, half extents, yaw and disposal unchanged |
| CAR-09 | Mesh/root/collider disposal and repeated re-entry without leaks |
| CAR-10 | Voight/camera, garage, roads, lights, controls and world regressions |

Run `npx tsc --noEmit`, `npm run test`, `npm run build` and `npm run lint` after source integration. Report actual command results and counts. Compare matched side, front, rear, elevated, near-Voight and distant street views by day and night. Measure active meshes, triangles, draw calls and frame p50/p95 on matched hardware; do not infer FPS from a geometry estimate.

**Current status:** The car source edit and new automated tests were rejected by the GitHub connector's source-write safety checks. CAR-01–10 remain NOT RUN/BLOCKED. User visual approval and VIS-07 remain pending. A READY Vercel preview alone does not prove vehicle visual improvement. Task 4 retains its performance scope and task 5 must report these open gates.
