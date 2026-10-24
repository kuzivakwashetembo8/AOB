# GTD-NH-REBUILD-003 — North Heights Visual Standard (AUTHORITATIVE)

Date: 2026-10-24
Status: **Owner-approved target image, NOT an in-engine accomplishment or approved implementation.**
Branch: trial/north-heights-reconstruction-001 (experiment only; must not touch main).
Priority: This document supersedes REBUILD-001 / REBUILD-002's **visual acceptance** criteria where conflicting; those implementations remain historical checkpoints.

## Approved visual reference

User-approved source: "North Heights Downtown City Preview(1).png", image attached in the GTD North Heights conversation on 2026-10-24.
Dimensions: 1672 × 941 px. SHA-256: \`ebdf6eb70720c1d58b79c65e620762a1536554d8be111f852271d5ea556ee9db\`.
The image was generated as **concept art** for REBUILD-003 and then explicitly approved by the owner as *the* quality/design standard. Its on-screen figures (142 buildings, 6,812 instances, 48 FPS, 11,240ms) are **fictional mockup labels** — do not report as a measured build. Do not quietly substitute this generated screenshot for a browser rendering or claim its visual fidelity is currently implemented.

The original referenced city_pack_8.glb by Pasha remains rejected as visible runtime geometry. Attribution obligations for influence/reference remain documented in NH-001 / NH-002.

## Non-negotiable scene language

1. **Dense but coherent skyline.** Mix highly articulated glass office towers, stone/concrete commercial mid-rises, brick residential/mixed-use, and more residential hill-side buildings in a believable hierarchy; differentiate roof profiles and podiums; avoid repeated copy-paste blocks.
2. **Square windows.** Evenly spaced near-square openings/curtain-wall modules, consistent building-level color tint. **Do not** revert to very wide blue strip windows; **do not** use distracting random bright-white window cubes. Geometry/material choice must be stable per building.
3. **Real aperture behavior.** Where windows are individual openings, the opaque facade must NOT continue behind them. Use separated facade wall sections, an inset glazing plane with alpha/reflection, and a recessed dark interior / interior-floor shell. For glass towers a curtain wall with supporting frame and visible interior darkness is acceptable. A translucent decal on a solid concrete box is not.
4. **Readable materials.** Variety and legible PBR-inspired shading: concrete, stone, brick, glass, rooftop membrane/metal. Glass should show sky reflections and partial interior/transmission where affordable, without expensive per-pane simulated refraction.
5. **Streets must match accepted South Ward.** Reuse existing material recipes and road cross-section (8m local two-lane asphalt, approximately 3.75m raised pavements, 0.20m curb, legal lane dash proportions), while adapting continuous grade. Roads and sidewalks cannot overlap at identical heights or form black-on-grey z-fighting tiles. Intersection asphalt must remain continuous, sidewalks/curb corners should not cover street junctions.
6. **Sidewalks and crossings.** Continuous pedestrian walking surface along both sides, raised and visually obvious, traversable curb corners/ramps and zebra crossings at suitable intersections, accessible shop/building entrances. Must be useful on foot, not merely two road stripes.
7. **Established South Ward greenery.** Replace green box lawns and cube canopies with the existing procedural textured grass and organic tree methods. Trees have tapered trunks, branching, layered natural foliage; no leaves.glb dependency (known to cause mobile lag).
8. **Street-level occupancy.** Place occasional parked vehicles, lampposts, curb drains and restrained street furniture. Do not load all high-detail vehicles in the entire city; use optimized proxies or instanced variants, lazy-load near player.
9. **Sky/atmosphere.** Retain accepted Meridia South Ward dusk/day/night palette and deterministic star field; the reference's clear daylight and atmospheric distance establish the **daytime inspection look**, not a requirement to eliminate South Ward night behavior.
10. **Camera framing.** A believable district-level oblique view that shows skyline **and** at least one detailed street intersection with visible curb/grass/crosswalk/tree anatomy; a pure rooftop closeup fails to prove street-level quality.
11. **Identity.** Elevated North Heights hill/overlook geography with a lower edge transitioning toward Meridian Central. The reference's flatter downtown tower region informs only that lower edge; avoid turning entire North Heights into an endless Manhattan grid.

## Implementation boundaries / performance

- Keep route \`/north-heights-preview\`, generator modules and documents exclusively in the trial branch.
- No edits to \`/game\`, \`main\`, GTD's accepted character movement/driving, PWA/offline, Rapier world or loading instrumentation.
- Prefer reusable geometry templates, shared materials, thin instance batching, distance-based detail / district cells; minimize transparent sorting and overdraw; show CPU load seconds, geometry instance count, FPS and error report truthfully.
- Do not promise identical photorealistic image output from low-cost procedural browser geometry. Match its underlying geometry, land use, scale, road/curb legibility, coherent facade language and atmosphere within device budgets.
- Target gameplay constraints: sub-60s initial load; smooth mobile at its tuned internal resolution; desktop should preferably exceed 40 FPS in equivalent camera positions; FPS must be device-measured, not inferred from mockup text.
- Do not trade accuracy for artificial counts: a lower instance count alone does not prove better image quality or frame rate.

## Sequenced quality gates

**Gate A — ground / pedestrian network:** Road asphalt + lane markings at unique height layers, joined intersections, sidewalk corner seams/curb cuts, grass buffer and at least one visible zebra crossing. Test from overhead and 2m pedestrian viewpoint. No further block detailing while black/grey surface flicker persists.

**Gate B — building apertures:** One tower, one mid-rise and one residential building demonstrate *square* near-1:1 windows, one uniform tint per building, no opaque backing behind transparent glass, believable inset frames and interior darkness. Test inside and outside, front and side.

**Gate C — vegetation / environment:** Procedural South Ward tree canopy/bark/grass look with no cube foliage, parks and street trees, repeatable day/dusk/night sky; assess memory and FPS.

**Gate D — district composition / performance:** Spread accepted assets across blocks using seeded diversity, vary tower roof/podium, profile at the same view in desktop/mobile, compare against image by category without calling it identical. Voight and UAL both present in inspection region, fly controls remain usable.

## Acceptance evidence required

A new *real Vercel browser preview* plus paired screenshots: skyline oblique, street-level intersection, up-close glass/window penetration, and dusk/night sky. Actual device FPS and initialization duration should appear with device/context. The owner must approve each substantial checkpoint; the generated concept image cannot stand in for browser evidence. If a gate cannot be implemented in reasonable GPU cost, document the fidelity/performance tradeoff explicitly.

The user explicitly said on 2026-10-24: "What you generated is the actual standard." Treat this as approval of the **target design**, not an instruction to merge nor proof of completion.
