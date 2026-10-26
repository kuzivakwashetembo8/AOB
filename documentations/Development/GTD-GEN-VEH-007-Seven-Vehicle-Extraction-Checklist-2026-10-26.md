# GTD-GEN-VEH-007 — Seven Remaining Source Extractions
Date: 2026-10-26
Branch: feature/gtd-remaining-seven-extraction-001
Owner authorization: extract ALL remaining types, document task list, validate preview on mobile.
BMW prohibition: do not reintroduce BMW moving traffic. Preserve original BMW source and parked/drivable GLB.

## Execution checklist
| ID | Model | Original asset | Step 1 audit | Step 2 source-native exterior | Step 3 wheel fit | Regression/preview |
| --- | --- | --- | --- | --- | --- | --- |
| GEN-VEH-007A | Toyota Hilux 002 | `public/GLBs/Cars/toyota hilux 002.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007B | Land Rover Defender 001 | `public/GLBs/Cars/Land rover defender 001.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007C | Dodge HP | `public/GLBs/Cars/dodge_HP.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007D | Four Door Sedan | `public/GLBs/Cars/Four Door Sedan.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007E | Fourd Confusion Hatchback | `public/GLBs/Cars/Fourd Confusion Hatchback.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007F | Taxi | `public/GLBs/Cars/Taxi.glb` | TODO | TODO | TODO | TODO |
| GEN-VEH-007G | Renault Kango Optimized | `public/GLBs/Cars/Renault Kango Optimized.glb` | TODO | TODO | TODO | TODO |

## Shared technical contract
1. Audit each original GLB's node transforms, primitives, normals, material names, bounding box, wheel nodes and triangle counts before extraction. Never infer exact labels or dimensions from another model.
2. Decode source body into separated paint, glazing, trim and lighting; preserve independent primitive topology, source normals and panel seams. Quantize geometry offline. Reuse Babylon source-native templates via thin instances. Do not replace at camera proximity, load moving GLBs, or use animated dots.
3. Derive four exact tyre centres and radius/width/axle orientation. Keep real wheel rims distinct and visible; run rolling wheels, front steering, grade contact, no wheel sinking.
4. Keep 125 NH012 simulation agents with 34 Sedan/Hatchback/Taxi/Kangoo relabelled and 91 default actors of five BMW-free families. Preserve accepted source-derived Lamborghini and Range Rover. Never alter original six parked/drivable GLB specimens.
5. Bound loaded body triangles for mobile; fail closed if source cannot be confidently isolated. Do not report procedural approximations as exact GLB source extraction. Unit tests for source geometry and fleet IDs, build integrity and visual Android inspection before merge.
6. Compare mobile performance against the accepted BMW-free branch; unresolved high triangle counts may require additional per-primitive LOD or deferral, never silently reintroduce very heavy meshes.

Status tracked here; completion requires actual CI build and user visual approval, not a successful commit alone.
