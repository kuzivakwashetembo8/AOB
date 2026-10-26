# GTD-GEN-VEH-002 — Lamborghini source-exterior extraction (no runtime GLB)
Date: 2026-10-26
Branch: feature/gtd-generated-vehicles-001
Base experiment: GEN-VEH-001, owner accepted mobile smoothness; visual fidelity rejected.
State: controlled implementation in progress; no production merge.

## Observed source inventory
Actual owner committed source: public/GLBs/Cars/Lamborghini+Temerario.glb (4,499,268 bytes).
GLB 2.0, Draco mesh compression and WebP material texture extension.
782 meshes, 827 nodes, 80 material families, approximately 563,025 indexed source triangles.
Source groups recorded from glTF mesh/node metadata: EXT 301 meshes / ~311,029 triangles, INT 315 / ~170,703, DOOR 23 / ~11,760, GLS 14 / ~3,605, LGT 36 / ~12,096, WHL 68 / ~17,720; remaining undercarriage and accessory groups.
These counts are SOURCE inspection, not a runtime performance benchmark.

## Implementation contract
- Decode the ACTUAL original source Draco POSITION and triangle topology offline during the prebuild. Preserve node-world transforms.
- Select exterior EXT, DOOR, GLS, LGT and authored external paint; exclude full interior, chassis and source wheel assemblies from the traffic-body reconstruction. Retain GEN-VEH-001 wheel steering/rolling/contact system.
- Classify original face materials into paint / dark trim / glass / front lamps / rear lamps; normalize authored exterior to production Temerario footprint (4.75 m by 2.0 m by 1.28 m). Source front alignment must be checked against existing authenticated heading.
- Deterministically vertex-cluster the source triangle surfaces to mobile-compatible budgets, preserving input vertex coordinates within clustering tolerance. Bake compact signed-16-bit native vertex positions and unsigned-16-bit triangle indices into a build-generated TypeScript module. Explicitly NOT an unmodified original mesh and NOT a 1:1 visual match until owner confirmation.
- Construct native Babylon VertexData once per geometry/material and batch with existing thin instances. NEVER import or swap GLBs on moving agents; the six parked original GLBs remain the experimental control.
- Use original GLB solely at build time; source remains unmodified. Generator fails loudly if source changed, required exterior/material categories missing or output degenerate.
- Asset data is generated during prebuild; keep a safe placeholder source module in Git for standalone test compilation. The build-generated asset is deterministic and requires no network connection.

## Acceptance
1. Owner compares generated and original Lamborghini exterior at same North Heights camera angle.
2. Correct bonnet/front orientation, wedge roof shape, bonnet curvature, wheel arches, glass, lights and body silhouette.
3. 125 agents unchanged; zero moving GLB imports, zero dots.
4. Smooth Android flight retained; measure FPS and frame hitching before merge.
5. If visual fidelity is insufficient, adjust per-zone clustering and author part classification, not replace the result with runtime GLB loading.

## Step 1 — Accepted source extraction (2026-10-26; locked reference)
**Outcome:** Owner verified that the moving native reconstruction reproduces the Lamborghini's overall external silhouette and drastically reduces the observed Android traffic hitching. The surface is visibly **not accepted**: crumpled body patches, chipped/jagged panels, dark/bright blotches, absent source wheel detail and indistinct glass. Acceptance applies to the method and silhouette ONLY; 1:1 render quality and frame-time gains remain unmeasured.

### Reproducible source-to-native sequence
1. Begin with `public/GLBs/Cars/Lamborghini+Temerario.glb` (4,499,268 bytes) committed by the owner; verify GLB v2 header, embedded JSON/BIN lengths, 782 mesh definitions, 80 material definitions and `KHR_draco_mesh_compression`. Do not substitute online photography, imported textures, an artist's approximation, or a different Lamborghini model.
2. In `scripts/genveh002-extract-temerario.mjs`, traverse the glTF node graph and compose parent-to-child node transforms. Select `EXT_*`, `DOOR_*`, `GLS_*`, `LGT_*` and explicit body-paint node names. Exclude `INT_*` and source wheel groups from moving traffic. Important: hierarchy transforms must be applied before bounds normalization.
3. Decode each selected Draco-compressed primitive with `draco3dgltf` to recover original positions and indexed triangle faces. Classify into paint, glass, trim, frontLight and rearLight using source node names and material labels. The source's exact triangle connectivity and positions are the starting point, not guessed procedural roof rings.
4. Normalize extracted exterior geometry against a 4.75 m length, 2 m width and 1.28 m height footprint, align source front (source -X) to GTD's +Z traffic forward direction and keep the 20 Hz NH-012 traffic state unchanged.
5. Original Step-1 reduction aggressively snapped vertices into shared spatial cells across an entire material group until group-wide triangle budgets were satisfied (paint 9,500, glass 1,800, trim 4,500, front 600, rear 550). Packed integer millimetre positions and 16-bit indices were emitted as base64 fields `p` and `i` in build-generated `src/game/vehicles/temerario-source-data-002.ts`. Babylon `VertexData` reconstructs the five materials once, with shared thin-instance templates. Runtime makes no Lamborghini GLB request or close-camera swap.
6. `package.json` runs that extractor in `prebuild` before typecheck/test/build. Git contains a deliberately empty placeholder export only; actual packed geometry is generated deterministically in the Vercel build. Production main and six parked/drivable originals remain unchanged.

### Step-1 failure mechanism
The old group-wide spatial weld merged close but **unconnected** surfaces, sometimes from different `EXT_*` meshes. Vertex snapping moved genuine body contours and zeroed narrow triangles. Lost hard-edge/source-normal boundaries, recomputation of normals across fused sheets, and light/paint misclassification can all produce the photographed noisy, crumpled shell. No single hypothesis is yet established as the exclusive cause. Never abandon the successful source-extraction method; correct mesh conditioning instead.

### Protected baseline
- Accepted generated traffic branch initial preview: `3ea4791500eef815acc3bb764bbb614cb752ddd4` (`gtd-qhuej6kus-interlinkglobaltech.vercel.app`).
- Separate production GLB traffic remains available for A/B comparison.
- Locked invariants: 125 NH-012 agents; no moving GLB import; no diagnostic dots; road grade, wheel rolling/steering, character physics and six original parked/drivable models unchanged.

## Step 2 — Surface refinement (authorized, not yet accepted)
1. Remove group-wide welding. Keep each source node/primitive's vertex identities and material/hard-edge boundaries independent. Preserve source normals when valid, including normal transforms, and do not apply face smoothing across distinct panels.
2. Use a deterministic, bounded per-primitive *topology-preserving* conditioning pass. Avoid deforming silhouettes just to meet an arbitrary triangle count; prefer compact quantized positions and shared index/vertex buffers. Report source vs output triangles, positions, byte cost and part coverage explicitly in the build log.
3. Separate body paint from dark plastics, windows and light assemblies; do not fuse source material families by position. Preserve window/body separation and source panel orientation.
4. Validate original topological closure/non-degenerate triangles, finite normals, memory budget and correct traffic orientation with automated checks. Failed extraction must fail the preview build, not silently revert to generic wedge geometry.
5. Produce a new isolated North Heights preview. Owner compares from matched side/three-quarter views, checks for clean panels and mobile smoothness; no merge until accepted. Wheel/rim geometry fidelity is reserved for the following focused iteration.
