# FL4-VIS-B — Foliage cost projection

**Scope:** Analytical estimates only; not actual Babylon draw-call, GPU or frame-time measurements. The new crown planner is not yet connected to the renderer.

The existing three generated trees each have 30 transparent foliage planes: **90 foliage meshes total**, with one shared foliage texture/material. The proposed planner preserves those counts and the 15 existing trunk/root-flare meshes. It changes plane area and arrangement, which can affect alpha overdraw even with unchanged draw-call count.

Approximate summed quad area after world scaling (not actual visible alpha coverage):

| Tree | Current | Proposed |
| --- | ---: | ---: |
| Garage east | 170 m² | 148 m² |
| Pocket west | 231 m² | 292 m² |
| Pocket east | 172 m² | 156 m² |
| **Total** | **574 m²** | **596 m²** |

Estimated total area increases about **4%**, concentrated on the larger tree; actual fill rate depends on camera, overlap and alpha test/blend. Do not treat this as proof of a performance pass. Required: matched day/night screenshot review, scene draw calls, p50/p95 frame time and transparent overdraw assessment after renderer integration.
