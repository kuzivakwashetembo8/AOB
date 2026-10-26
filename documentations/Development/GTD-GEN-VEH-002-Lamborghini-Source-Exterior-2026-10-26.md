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
