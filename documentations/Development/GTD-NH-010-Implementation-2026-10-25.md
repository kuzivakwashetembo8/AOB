# NH-010 implementation checkpoint
Approved by owner on 2026-10-25. This implementation branch is based on accepted main merge 0ae0eb9.
- Source of truth is deterministic reserved NH-03-05 parking, preexisting GLB IDs and shared location registry.
- BUILD/TEST/OWNER VISUAL ACCEPTANCE required prior to main merge.
- GLASS-001/002 changes explicitly excluded; source stays identical to accepted main.

## Implementation checkpoint 1 — authored on NH-010 branch
- Added pure deterministic parking plan for reserved vacant Glass Exchange NH-03-05, six occupied owner-GLB bays. Reserved NH-04-07 for six additional empty future stalls; excluded all trees and building development from those parcels.
- Existing South Ward native fleet GLB pipeline and FirstDriveTrial reused, without copied assets. Added virtual vehicle-only building footprint barriers to the existing shared Rapier drive solver: pedestrians can enter genuine building portals, cars cannot pass through them.
- Replaced decorative door meshes, continuous doorway glazing and solid black building cores with unblocked openings, empty white floors and roof undersides; physical shell walls/lintels/floors replace the original one solid cuboid collider per building. Lowered foundation/threshold to within ordinary Rapier walking step.
- Added shared HUD minimap slot, vector 2D map, green actor / driven-car marker, two parking parcels and touch driving control parity.
- Added focused Vitest spatial/geometry/map tests. First early branch preview at 17be2e4 reported Vercel READY, 127 test files / 504 tests passed. Latest revisions require an independently green Vercel build.
- Original GLASS-001/002 experimental reflections remain excluded. Production main unchanged.
- Visual/physical-device acceptance remains pending. No claim of tested mobile frame time or guaranteed six-car asset readiness until browser gameplay inspection.
