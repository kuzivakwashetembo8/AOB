# CHAR-117 — Torso Posture Implementation — 2026-10-21

Status: candidate implemented on Walking-Posture-Refinement; awaiting Harmony's visual acceptance.
Reference: [standing and walking observations](GTD-CHAR-117-Standing-and-Walking-Torso-Observations-2026-10-21.md).
Baseline: e5b1a2f217bc86345f65b0f924ed3412bdfbda85.
Harmony's current instruction authorizes applying the reference; the original observations remain unchanged.

## Inspection and correction
Inspected both supplied annotated screenshots and the actual 73-joint character.glb hierarchy, bind matrices, weights and skinned triangles. CHAR-116 aimed the upper arm only 0.06 outward per unit down (3.4 degrees), then rolled the forearm about its wrist axis. That small cant and axial roll did not create the required articulated sleeve contour.

In native-neutral-pose-109.ts, increase upper-arm cant to 0.24 per unit down (13.5 degrees). Aim the forearm independently at 0.08 outward and 0.20 forward per unit down, solved in the upper arm's parent frame. This gives a gentle elbow bend rather than an almost straight sleeve. Derive outward from actual bilateral shoulders and forward from the torso frame. Keep shoulders, chest, pelvis and leg rotations unchanged. Recompute each wrist against the accepted standing palm world frame. Apply fixed targets without accumulating offsets; roll back both arms if calibration fails.

Walking retains the existing CHAR-116 player, moderate cycle-centred arm swing, opposite-side timing, wrist behavior, lower-body correction and head stabilization. No source animation, skin weights, bind matrices or GLB bytes changed.

## Verification
- Three existing regression files: five tests passed.
- Strengthened actual-rig regression checks elbow clearance greater than 0.055 m, a gentle 0.18–0.45 rad upper-arm/forearm bend, unchanged non-arm neutral rotations, and accepted palm orientation.
- Targeted TypeScript check of the neutral and walking controllers passed.
- Compared baseline and candidate at standing plus 160 walk phases using Babylon linked-node world matrices: maximum change in pelvis, torso, head and lower-body matrices was exactly 0.
- CPU linear-blend skinning of actual GLB triangles, using the recorded Babylon world matrices and original inverse bind matrices, was inspected in matched front, three-quarter and side projections. This exposes the sleeve/waist relationship that joint spacing alone missed.
- [Diagnostic comparison](CHAR-117-torso-skinned-comparison.png): baseline above, candidate below; standing front/three-quarter and sampled walking front/side. Neutral material and CPU lighting are diagnostic, not a browser screenshot or in-game visual acceptance.

## Release boundary
No merge or deployment. Commit only to Walking-Posture-Refinement. A browser preview and Harmony's visual acceptance remain the next release checkpoint. The diagnostic improves evidence; it does not establish final artistic acceptance.
