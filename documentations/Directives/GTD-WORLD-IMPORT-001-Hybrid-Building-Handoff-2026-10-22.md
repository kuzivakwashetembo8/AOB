# WORLD-IMPORT-001 — Hybrid Building Pipeline and Team Handoff

Directive date: 2026-10-22 (Africa/Johannesburg).
Recorded: 2026-10-21.
Status: pipeline trial successful; responsibilities agreed; expansion design ready to develop. Documentation only in this handoff.
Repository: interlinkglobal/GTD.

## Harmony's direction
“We'll handle creation, acquisition, licences/attribution, you handle placement.”
“Document this. Tomorrow's directive scan should find this commit ready to expand.”

The team's split is established. The shared lot architecture below is the proposed way to mix generated and imported buildings; it is not already implemented or a claim that any arbitrary asset will work automatically.

## Responsibility split

| Owner | Responsibility |
| --- | --- |
| Harmony and asset team | Create/acquire source buildings, select district style and asset set, manage licences, redistribution permission and attribution information. Supply associated materials/textures when available. |
| Sol / Codex | Inspect supplied geometry and material structure, prepare game derivatives, normalize scale/orientation/pivots, optimize, prepare materials where needed, place assets, integrate loading/lighting/visibility and agreed collision, validate desktop/mobile behavior and deliver review previews. |
| Shared review | District composition and visual fit, scale, entrances/accessibility, performance limits, final appearance and acceptance before merging/releasing. |

Licence/attribution ownership remains with the team. Preserve their supplied records in asset metadata; do not invent licence terms or attribution. Missing supporting files should be reported to that owner with the specific names rather than silently represented as complete.

## Proven trial and exact continuation point

- Source: public/GLBs/Infrastructure/Minimal Modern Villa House N101225.obj.
- Implementation branch: Villa-OBJ-South-Ward-Trial.
- Runtime: 2a10c7abee156c8b6041fb756100606f0850bcac.
- Draft PR: https://github.com/interlinkglobal/GTD/pull/44
- Reviewed preview: https://gtd-62zy0urww-interlinkglobaltech.vercel.app/game?gtdVillaTrial=1
- Trial documentation, on that branch: documentations/Development/GTD-VILLA-001-Modern-Villa-OBJ-Trial-2026-10-21.md.
- Conversion: scripts/villa001-convert-obj.py, producing public/GLBs/Infrastructure/modern-villa-trial.glb.
- World placement: src/game/world/villa-obj-trial-001.ts, integrated through generated-first-light-world.ts.
- Source inspection: 5,454 positions, 8,320 triangulated faces, authored normals and UVs, four retained material names.
- Derivative: 625,076-byte GLB, four material meshes. SHA-256 7a5cfbe7f90273ee7d9b450c7a9eb1884cd10387d69a0be1d20a3291732ee20f.
- Temporary palette: warm timber, charcoal trim, ivory stucco and blue-grey translucent glass. This was reconstructed because no MTL was present at the trial baseline.
- Temporary scale: 0.001, Z-up source converted to Y-up; presentation bounds 30.478 x 12.363 x 18.858 m. Source units are not declared reliably, so this is a presentation assumption to review, not an asset-wide convention.
- Placement: center (-44,0.04,-27), approximately 7.37 m behind the west support building; procedural trees/shrubs excluded from that footprint plus a 2 m margin.
- Preview spawns on Mercer Street facing the villa; regular URLs retain their original view.
- Babylon loader test verifies four meshes, triangle count, grounding, dimensions and named materials. Repository-wide type checks/tests/build passed and the preview endpoint returned HTTP 200.
- Harmony's mobile screenshot shows the villa in South Ward and Harmony confirms the workflow is promising and assigns placement work to Codex. This is a successful first visual pipeline trial, not proof of batch-scale performance or a completed hybrid placement system.

PR #44 remains a separate trial. This documentation handoff does not merge it, deploy it or change its material/placement choices. Start tomorrow by checking its actual branch/PR state, since later activity may supersede this record.

## Late supporting-file update
Current main at documentation time: 210f4b731c377f43bccb9d806e49f3709eecc2bc.
It now contains Minimal Modern Villa House N101225.mtl, added after trial baseline 80fc766cbe6636317294c69c0dbd4fcafeb63797.

The new MTL defines Wood, Wood_2, Stucco and Glass. It references dr55rfvf.png, 2sszaw32.png and fiber01.png, which were not found in the repository snapshot. It specifies glass opacity d=0.1 and specular properties; the trial's reconstructed palette did not consume this MTL.

Harmony mentioned an STL, but the supporting file verified on main is MTL. No STL was needed for the successful OBJ trial. Check for any later STL/texture uploads tomorrow; prefer the source retaining useful material/UV structure rather than automatically switching formats. Inspect the new MTL and supplied textures before proposing a material revision. Do not silently replace the accepted-looking trial merely because another file arrived.

## Proposed hybrid architecture

Keep the existing deterministic city/district/neighborhood/block/lot layout. Its roads, setbacks, terrain and stable lot IDs continue to define where buildings belong.

Each building lot should select either:
- a generated building specification; or
- an imported building asset reference and placement profile.

Both must provide the same world-facing information. The renderer selection belongs inside the building/lot resolution layer, not a growing collection of unrelated load calls and hard-coded coordinates in the world bootstrap.

| Shared field | Required meaning |
| --- | --- |
| Stable identity | District/block/lot/building ID and, for imports, asset catalog ID/version. |
| Representation source | Generated archetype/rules or imported derivative asset reference. |
| Dimensions | Verified footprint and height in game metres; distinguish rendered overhangs from navigation/collision bounds. |
| Transform | Explicit unit conversion, upright/forward axes, grounded pivot, world position and yaw. |
| Frontage/access | Street-facing facade, entrance positions, door thresholds and approach clearance. |
| Materials | Surface families or imported material mapping, texture dependencies and approved appearance. |
| Collision/camera | Explicit visual-only, exterior collision or interior-ready status; verified collision shapes and camera blocking as appropriate. |
| Environment fit | Grounding, slope policy, setbacks, road/sidewalk clearance, vegetation exclusion and shadow behavior. |
| Runtime cost | Source/derivative bytes, triangles, meshes/materials/draw calls, texture memory and loading/LOD policy. |
| Provenance | Original file, derivative recipe/hash, team-supplied licence/attribution references and validation/acceptance state. |

This is a draft contract, not a schema migration in this commit. Inspect schema.ts, first-light-spec.ts, building-generator.ts and the existing streaming/LOD/validation paths before implementing the smallest compatible extension. Reuse existing generated-building behavior rather than replacing it.

## Tomorrow's execution sequence

1. Read this handoff and the current asset folder; verify the current main, trial branch and PR state. Protect the accepted CHAR-117/118/119 character work and existing South Ward buildings/roads.
2. Review the team's first supplied asset batch and supporting files. Produce a small inventory of building type, scale, bounds, material completeness, geometry cost and licence/attribution references owned by the team.
3. Define the shared lot contract and renderer selection against the actual current code. Keep generated and imported representations addressable by stable IDs and reproducible placement.
4. Adapt VILLA-001 as the first imported asset profile. Replace its one-off scale/coordinates with explicit metadata only after checking the rendered footprint, frontage and team-approved scale. Separate source assets from optimized game derivatives.
5. Demonstrate generated and imported lots coexisting in the same district without road/setback/vegetation conflicts. Add navigation collision or interiors only when supported and within the actual directive.
6. Extend to the first meaningful batch after the initial hybrid checkpoint is visually accepted. Avoid silently importing the whole collection at startup.
7. Measure desktop/mobile loading and frame behavior. Retain the one-minute initial-load target; a small download alone does not prove low GPU/memory cost. Account for texture memory, unique materials, shadows, duplicated geometry and instance/cache reuse.
8. Document results and provide a substantial visual checkpoint before merge/release. The team's next directive determines batch, district and release scope.

## Visual checkpoints
- First hybrid checkpoint: at least one generated lot and one imported lot resolved through the shared contract, with useful matched views and verified scale/clearance.
- Batch checkpoint: a meaningful district section showing several reviewed imports alongside generated context, with mobile/desktop evidence and measured loading/rendering cost.
- No deployments for negligible placement changes. Preview at substantial improvements; production remains an explicit release decision.

## What remains open
The district/batch composition, final imported-building scale, architectural coherence, material finish, collider/interior requirements, LOD/streaming thresholds and performance budgets require actual asset/code inspection and the next directive. The villa's temporary visual-only state and missing texture files must not be mistaken for finished gameplay integration.

The source OBJ already contained enough geometry and material identifiers for the first successful conversion; an STL was not required. The general workflow is now demonstrated. Expansion should preserve this evidence while turning one-off placement into a reusable district capability.
