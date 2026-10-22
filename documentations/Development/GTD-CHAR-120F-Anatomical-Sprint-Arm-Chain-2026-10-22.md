# GTD-CHAR-120F — Anatomical sprint arm-chain recovery
Date: 2026-10-22 (Africa/Johannesburg)
Branch: feat/char-120-natural-athletic-sprinting-20261022
Baseline: e08bdf6e81293d421aa029805bc0531e06bf5b05
Status: authorized implementation; visual acceptance pending.

## Defect
Owner references proper arm bending.png and proper arm swinging.png show the distinction between a bent elbow and a correctly carried running arm. Voight's hand can remain near the thigh or behind the hip despite increased local forearm rotation. Preserve accepted legs, travel speed, torso and walking.

## Code findings
CHAR-120C inverts the complete mean forearm quaternion rather than a calibrated elbow hinge. CHAR-120E rotates the upper arm toward a wrist target but fixes forearm flexion, does not constrain the elbow plane, and accepts relative error reduction rather than absolute anatomical success. Synthetic rigs do not establish actual character.glb silhouette correctness. The bake's bind-parent basis and playback's relaxed neutral basis differ; this is a contributor hypothesis to measure, not a proven isolated cause.

## Implementation plan (recorded before code)
1. Reconstruct the actual character.glb hierarchy and skin; verify its Git blob identity against the branch. Measure baseline shoulder/elbow/wrist positions over the authored sprint cycle.
2. Recover anatomical shoulder-elbow-wrist trajectories from the existing UAL Sprint_Loop at build time, in an explicit body frame. Preserve source timing; do not invent a new gait oscillator.
3. Map source directions and elbow bend onto target segment lengths. Define a reachable wrist target and an elbow pole from the source bend plane. Calibrate the target neutral arm frame, including its plane, before applying rotations.
4. Replace the old mean-inversion/wrist-only correction in the live sprint arm path with a coordinated arm-chain solution. Enforce finite transforms, safe geometry and exact neutral restoration. Blend with walking without accumulating per-frame corrections.
5. Verify actual-rig elbow angle, pole direction, wrist position, bilateral phase and yaw/scale behavior over a full cycle. Check untouched joint rotations against the baseline and inspect skinned side/front renders. Update obsolete tests that enshrine the superseded local-quaternion implementation, retaining regression protection.
6. Commit implementation and evidence; publish one intentional preview of the tested commit. Verify deployment status and release identity. Main and production remain unchanged.

## Acceptance
Leading forearm carried forward and upward, trailing elbow behind/beside torso with hand near the hip; no backwards folding, torso crossing, shoulder displacement or leg regression. Geometry tests are necessary but the owner retains final in-game visual acceptance.

## Execution
Pending measurement, implementation and preview.
