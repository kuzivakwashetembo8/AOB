# FL4-VIS-B01 — Tree Canopy Audit (2026-10-10)

**Source:** `development/meridian-fl4-optimization`. Canonical First Light SOT and FL-4 visual decision record govern. Task 1 reported architectural implementation BLOCKED; this tree work does not modify windows.

**Active scene:** `first-light-runtime-source.ts` selects `generated-first-light`. The active tree path is `world-generation/street-context.ts` → `street-context-renderer.ts`, not the dormant authored `world/first-light-world.ts`.

**Existing geometry:** Three seeded trees. `item.scale` is 0.94–1.10; `item.canopyScale` is approximately 1.08–1.31, but **is not consumed by the renderer**. A continuous 5.05 m trunk (diameters 0.66/0.70 m) plus four root flares is accepted. Each tree renders 10 foliage clusters × 3 double-sided alpha planes = **30 cards**, one shared material and texture. Tree collision is a separate Rapier cylinder (radius 0.28 × scale); changing foliage must not modify collision.

**Audited authored tree samples** (deterministic generator version 1; envelope estimates, not GPU measurements):

| Tree | Scale | Canopy input | Prior approximate crown radius | Planned radius |
| --- | ---: | ---: | ---: | ---: |
| Garage east | 0.943 | 1.108 | 3.56 m | 3.50 m |
| Pocket west | 1.099 | 1.209 | 4.15 m | 4.77 m |
| Pocket east | 0.948 | 1.195 | 3.58 m | 3.60 m |

The large pocket tree gains approximately 15% lateral envelope; the smaller trees stay restrained. The intended crown becomes broader and vertically layered without increasing card count.

**Limitations:** No matched rendered screenshots, measured draw calls or actual phone GPU timings were captured. The 01:00 task's facade code correction remains independently blocked.
