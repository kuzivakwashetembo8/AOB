# GTD-VEH-CABIN-FIT-003 — Interior Boundaries and Foot Containment

Date: 2026-10-15. Status: IMPLEMENTATION AUTHORIZED; isolated experiment only.
Baseline: AR1 owner-approved seating on `exp/veh-seat-001-ual-driving-loop-20261015`.
Implementation branch: `exp/veh-cabin-fit-003-20261015`.

## Problem statement

AR1 has established **sitting**: accepted upper-body posture in the Ferrari. It has not established general **fitting**: actual shoe geometry may pierce the car's underside, and future Buggy/cars have different cockpit proportions. Owner request: preserve AR1, investigate the originating limb/mesh geometry, and implement a reusable real-interior-boundaries mechanism without speculative global offsets.

## Evidence and verified asset capabilities

The pinned Ferrari `ferrari.glb` contains a true `carpet` mesh with material `Carpet` and an interior source-space vertical span approximately Y=0.214–0.669 m, distinct from the exterior vehicle anchor. It must be sampled from its **actual triangles**, not assumed to be a plane or blindly use the bounding-box bottom. The pinned UAL `ual.glb` contains skinned meshes `Mannequin_primitive0` and `Mannequin_primitive1`, with independent `foot_l/ball_l/foot_r/ball_r` bone influences. In the actual Babylon.js 9.29.0 NullEngine, `skeleton.prepare(true)` followed by `mesh.getPositionData(true,false)` responds to bone transform updates; therefore the runtime can identify the *visible deformed shoe vertices* rather than only an ankle pivot. Identical GLB Git object hashes were checked against the earlier AR1 audit.

**Unverified at authoring:** The exact magnitude, per-foot side, and location of the owner's leaked mesh in the successful gameplay viewport. Screenshots support visual leakage, not millimetric clearance. The new diagnostics must establish those facts from runtime geometry. Never report a hypothetical sole offset as a measured one.

## Design contract

1. A `VehicleCabinDefinition` identifies the vehicle class and real imported surfaces supplying footwell support; it does not inherit exterior body dimensions as a floor reference.
2. Each specimen has independent `cabinfloor` evidence, with explicit states `verified`, `missing-surface`, `outside-floor-mesh`, `invalid-geometry`. The Ferrari points at the real `carpet` mesh; Buggy's cabin profile is **unverified** until its actual floor can be identified. Do not reuse Ferrari measurements.
3. A shoe-sole witness queries CPU-skinned points *predominantly influenced by that foot/toe's bones* and computes the lowest actual world-space shoe vertex; torso and arms are not involved. No global model shrinking, feet hiding or moving the entire vehicle.
4. A correction is eligible only if the floor and shoe witnesses are finite, the penetration is **small and positive**, the new ankle goal is reachable, the two-link IK step converges and a post-step shoe witness is not worse. Reject and restore the previously accepted AR1 leg pose for any failure.
5. Clearance goal: at least 10 mm; cap trial adjustment at 80 mm. If the leak exceeds the cap or lacks a stable floor, fail closed and report; do not improvise a larger shift.
6. Do not rescan all scene meshes each frame. Cache imported floor mesh and shoe vertex influences when entering, perform bounded audits/correction attempts after the driving animation is evaluated; provide read-only on-demand report.
7. Opt-in `?gtdCabinFit003=1` in addition to AR1's flags; default legacy AR1 remains unchanged. Exit restores AR1 baseline.
8. G4 acceptance still requires actual side/overhead views, no boot/hand/torso regression, and future mobile verification. Automated unit tests alone cannot authorize main merge.

## Gates

G0: locate Ferrari floor and foot vertices; report real per-side deficits.
G1: prove localized lower-limb correction does not affect torso/root.
G2: validate new foot sole min against actual floor triangles and require reversible acceptance.
G3: test missing/unsupported Buggy profiles fail safely; provide registration contract for later calibrated vehicles.
G4: TypeScript/Vitest/build and isolated Vercel preview; collect owner visual evidence.
G6 remains closed under the original VEH-FIT-002 agreement until G1–G4 visual acceptance.

No main merge or replacement of the accepted AR1 preview. Document new results/limitations here after tests.
