# GTD-RND-MAT-001 — Brick Material Trial A: single-building preview
**State:** experimental, awaiting live desktop acceptance. NOT an accepted GTD-wide material or building policy. **Branch:** `feat/gtd-world-002-municipal-administration-20261012`; no production/main changes to building code.

## Owner-supplied source and provenance
- Source: `public/brick-wall-image.webp`, committed independently by the owner to `main`. Exact blob reused on the experiment branch **without transformation**.
- SHA (Git blob): `7a6d9bfd8730f852c55d439ffe01a622bba5d1dc`.
- Encoded: **639,570 bytes**; WebP VP8, **1774 × 871 px**, ratio approximately 2.0367:1 (not strictly 2:1). No alpha expected; experimental material forces opaque rendering.
- Transfer size is not GPU memory. Raw RGBA8 is approximately 5.90 MiB before mipmaps (approximately 7.85 MiB with a full chain). Measure actual GPU memory and browser decode on target devices; no performance certification yet.

## Experiment activation and protected baseline
- Flag: visit `/game?gtdBrickTrial=1` to enable; visit `/game` with no flag to see the previous procedural building surfaces.
- **Only building ID:** `sw-fl-south-apartment`, three-storey residential building **south of Mercer Street**, around world coordinates x=-18, z=20.3. Road and building colliders, windows, doors, facade grammar, garage, other buildings and vehicles are untouched.
- The trial does not alter `main` or automatically activate when merged. A separate owner decision and SEC gate would be required to scale beyond this location.

## Rendering method
- Image loaded only from the allowlisted same-origin path `/brick-wall-image.webp`; cached as a single Babylon texture and used on this building's wall-role meshes only.
- For this trial, tile represents approximately **1.35m horizontally** and **1.35×871/1774 ≈ 0.663m vertically**. This intentionally preserves the exact owner's slightly non-2:1 image aspect. These physical dimensions are provisional visual calibration, not a universal brick dimension.
- Each wall box gets individual UVs in building-relative local metres, rather than a constant arbitrary repeat count per box. Front/rear faces map (x,y); side faces map (z,y). Shared origin keeps courses continuous across differently sized wall sections and window interruptions.
- Thin-instance grouping is bypassed **only** for the target wall-role meshes because differently sized thin instances otherwise share a single UV layout, stretching brick size unpredictably. Other geometry still uses the established batching mode.
- Existing window frames and glass remain separate materials and geometry; this test does not produce physically recessed windows where the baseline has decorative ones.
- The old procedural brick recipe is created as a nonblocking fallback. If WebP decoding or loading fails, the fallback remains, with a console warning; startup and physics are never blocked.
- Both image and fallback textures, plus the special material, are disposed with their owning building. No PBR overhaul, normals, displacement or diffuse/roughness map pack has been authorized.

## Desktop acceptance checklist
1. Find south-of-Mercer apartment near x=-18, z=20.3; compare `/game?gtdBrickTrial=1` vs `/game` at the **same camera pose and time of day**.
2. Walk parallel to the facade and around the corner; check the brick scale in metres, aligned mortar courses, seam placement and no stretching beside windows.
3. Inspect top, bottom and left/right tile boundaries at close range. Any repeated lines, mirror seams or unnatural edge bricks are defects, not acceptable tiling.
4. Check windows for any unexpected photographic bleed, obscure brick overlays or missing structural details. Existing decorative glazing is not a newly authorized physical wall cut.
5. Inspect at midday, dusk and night; the WebP source may contain baked relief highlights that cannot respond perfectly to lights as a real normal/roughness material would.
6. Test the no-flag baseline and first frame again; verify touch and Ferrari unchanged. Evaluate mobile performance only **after** owner desktop acceptance.
7. If the texture looks wrong or loads poorly, remove the URL flag to return to the untouched procedural baseline. Report screenshot and time-of-day; do not silently broaden the experiment.

## Verification
Focused tests: `brick-material-trial-a.test.ts` checks exact asset path/scope, native ratio, metre-scaled UV mapping on actual individual wall meshes near windows, parity without flag, intact geometry and resource disposal; existing image-contamination tests protect against the prior hero-photo leak. Vercel READY and NullEngine checks alone are insufficient for visual acceptance.

**Decision gate: OPEN.** A useful preview does not adopt high-resolution texture assets as an official GTD architecture or performance standard. Approve separately after material quality and measured browser/mobile costs.
